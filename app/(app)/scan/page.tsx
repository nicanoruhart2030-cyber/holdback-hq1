import Link from "next/link";
import { ScanUploader } from "@/components/scan-uploader";
import { Card, DateText, Empty, Money, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Scan } from "@/lib/types";

export const metadata = { title: "Cash Leak Scan" };

export default async function ScanPage() {
  const { profile } = await getProfile();
  if (profile?.role !== "admin") return <Notice>Cash Leak Scan is available to agency admins only.</Notice>;
  const supabase = createClient();
  const { data: scans } = await supabase.from("scans").select("*").order("created_at", { ascending: false }).returns<Scan[]>();

  return (
    <>
      <PageHeader
        title="Cash Leak Scan"
        description="Upload a prospect's past invoices to show what they are owed: outstanding balances, overdue amounts by GC, unreleased holdback, lapsed dispute windows and WSIB gaps."
      />
      <Card title="New scan"><ScanUploader /></Card>
      <Card title="Recent scans" flush className="mt-6">
        {(scans ?? []).length === 0 ? (
          <Empty>No scans yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Prospect</th><th>Created</th><th className="text-right">Outstanding</th><th className="text-right">Overdue</th><th>Retention</th><th>Status</th></tr></thead>
              <tbody>
                {(scans ?? []).map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`/scan/${s.id}`} className="font-medium hover:text-accent">{s.prospect_company ?? s.prospect_name}</Link><div className="text-xs text-muted">{s.prospect_name}</div></td>
                    <td><DateText value={s.created_at.slice(0, 10)} /></td>
                    <td className="text-right"><Money value={s.report?.total_outstanding ?? null} whole /></td>
                    <td className="text-right"><Money value={s.report?.total_overdue ?? null} whole className={(s.report?.total_overdue ?? 0) > 0 ? "text-danger" : ""} /></td>
                    <td className="text-xs text-muted">{s.converted_client_id ? "Converted, kept" : <>Deletes <DateText value={s.expires_at?.slice(0, 10)} /></>}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
