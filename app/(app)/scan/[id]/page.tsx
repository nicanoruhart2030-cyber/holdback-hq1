import Link from "next/link";
import { notFound } from "next/navigation";
import { convertScanAction, deleteScanAction } from "../../actions";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Card, DateText, Empty, Field, Money, Notice, Num, PageHeader, Stat } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Scan } from "@/lib/types";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await createClient().from("scans").select("prospect_name, prospect_company").eq("id", params.id).maybeSingle<{ prospect_name: string; prospect_company: string | null }>();
  return { title: data ? `Scan: ${data.prospect_company ?? data.prospect_name}` : "Scan" };
}

export default async function ScanReportPage({ params }: { params: { id: string } }) {
  const { profile } = await getProfile();
  if (profile?.role !== "admin") notFound();
  const supabase = createClient();
  const { data: scan } = await supabase.from("scans").select("*").eq("id", params.id).maybeSingle<Scan>();
  if (!scan) notFound();
  const r = scan.report;
  const { data: files } = await supabase.from("scan_files").select("file_name, confidence, error").eq("scan_id", scan.id);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/scan" className="hover:text-fg">Cash Leak Scan</Link>}
        title={scan.prospect_company ?? scan.prospect_name}
        description={r ? <><Num>{r.invoice_count}</Num> invoices analysed · generated <DateText value={r.generated_on} /> · total invoiced <Money value={r.total_invoiced} /></> : "Processing"}
        actions={r ? <a href={`/api/scan/${scan.id}/pdf`} className="btn-primary">Export PDF</a> : null}
      />
      {!r ? (
        <Notice tone="warn">This scan has no report. Delete it and run it again.</Notice>
      ) : (
        <>
          {r.unreadable_count > 0 ? <div className="mb-5"><Notice tone="warn"><Num>{r.unreadable_count}</Num> files could not be read. Check OCR and AI configuration.</Notice></div> : null}
          <section aria-label="Scan totals" className="grid grid-cols-1 divide-y divide-line rounded-card border border-line md:grid-cols-3 md:divide-x md:divide-y-0">
            <Stat label="Total outstanding" value={<Money value={r.total_outstanding} whole />} hint="Unpaid balances, net of holdback" />
            <Stat label="Overdue" value={<Money value={r.total_overdue} whole />} hint={r.total_overdue > 0 ? <Badge tone="danger">Past the payment window</Badge> : "None"} />
            <Stat label="Unreleased holdback (est.)" value={<Money value={r.holdback_estimate} whole />} hint="Retained on invoices analysed" />
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Overdue by payer" flush>
              {r.overdue_by_gc.length === 0 ? <Empty>No overdue invoices.</Empty> : (
                <table className="table">
                  <thead><tr><th>Payer</th><th className="text-right">Invoices</th><th className="text-right">Oldest</th><th className="text-right">Amount</th></tr></thead>
                  <tbody>{r.overdue_by_gc.map((g) => (
                    <tr key={g.gc_name}><td>{g.gc_name}</td><td className="text-right"><Num>{g.invoices}</Num></td><td className="text-right"><Num>{g.oldest_days}d</Num></td><td className="text-right"><Money value={g.amount} className="text-danger" /></td></tr>
                  ))}</tbody>
                </table>
              )}
            </Card>
            <Card title="Lapsed notice-of-non-payment windows" flush>
              {r.missed_windows.length === 0 ? <Empty>None found.</Empty> : (
                <table className="table">
                  <thead><tr><th>Invoice</th><th>Payer</th><th>Closed</th><th className="text-right">Amount</th></tr></thead>
                  <tbody>{r.missed_windows.map((w, i) => (
                    <tr key={`${w.invoice_number}-${i}`}><td className="num">{w.invoice_number}</td><td className="text-muted">{w.gc_name}</td><td><DateText value={w.window_closed} /></td><td className="text-right"><Money value={w.amount} /></td></tr>
                  ))}</tbody>
                </table>
              )}
            </Card>
            <Card title="WSIB clearance gaps" flush>
              {r.wsib_gaps.length === 0 ? <Empty>No gaps found.</Empty> : (
                <ul>{r.wsib_gaps.map((g) => (
                  <li key={g.gc_name} className="flex justify-between gap-3 border-b border-line px-5 py-3 text-sm last:border-b-0"><span>{g.gc_name}</span><span className="text-right text-warn">{g.reason}</span></li>
                ))}</ul>
              )}
            </Card>
            <Card title="Assumptions">
              <ul className="list-inside list-disc space-y-1 text-sm text-muted">{r.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
              <p className="mt-4 text-xs text-faint">Files: {(files ?? []).length}. {scan.converted_client_id ? "Converted to a client; retained." : <>Deletes automatically on <DateText value={scan.expires_at?.slice(0, 10)} />.</>}</p>
            </Card>
          </div>
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {!scan.converted_client_id ? (
          <Card title="Convert to client">
            <form action={convertScanAction} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input type="hidden" name="id" value={scan.id} />
              <Field label="Trade"><input name="trade" required className="input" /></Field>
              <Field label="Plan">
                <select name="plan_tier" defaultValue="crew" className="input"><option value="solo">Solo</option><option value="crew">Crew</option><option value="pro">Pro</option></select>
              </Field>
              <Field label="Monthly fee"><input name="monthly_fee" type="number" step="0.01" min="0" defaultValue="499" className="input num" /></Field>
              <div className="md:col-span-3"><SubmitButton pending="Converting">Create client and keep data</SubmitButton></div>
            </form>
          </Card>
        ) : (
          <Card title="Converted"><Link href={`/clients/${scan.converted_client_id}`} className="link">Open client</Link></Card>
        )}
        <Card title="Delete scan">
          <form action={deleteScanAction} className="flex items-center justify-between gap-3">
            <input type="hidden" name="id" value={scan.id} />
            <p className="text-sm text-muted">Removes the report and all uploaded documents now.</p>
            <SubmitButton className="btn-danger" pending="Deleting" confirm="Delete this scan and its documents?">Delete now</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
