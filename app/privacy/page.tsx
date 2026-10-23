import Link from "next/link";

export const metadata = { title: "Privacy" };

const PROCESSORS = [
  ["Supabase", "Database, authentication and private file storage", "Region set at project creation; we use ca-central-1 (Montréal, Canada)"],
  ["Groq", "Extracting invoice fields and drafting reminder emails, paid API tier only", "United States"],
  ["Google Cloud Vision", "OCR for scanned invoices, only when text cannot be read directly", "United States / Google global infrastructure"],
  ["Resend", "Delivering emails you have explicitly approved", "United States"],
  ["Vercel", "Application hosting and the daily deadline job", "United States / global edge"],
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <Link href="/dashboard" className="h-display text-lg">Holdback <span className="text-mint">HQ</span></Link>
      <h1 className="h-display mt-10 text-[40px]">Privacy</h1>
      <p className="mt-3 text-muted">How Holdback HQ handles subcontractor business data, under Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA).</p>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold">What we hold</h2>
          <ul className="list-inside list-disc space-y-1 text-muted">
            <li>Client business details: company name, trade, contact name, email and phone.</li>
            <li>Project details: payer names and accounts-payable emails, addresses, contract values and dates.</li>
            <li>Invoices you provide, the fields extracted from them, payment status and holdback amounts.</li>
            <li>WSIB clearance certificate numbers and dates.</li>
            <li>Draft and sent reminder emails, and a log of every change and automated action.</li>
            <li>For Cash Leak Scans: the prospect&apos;s name, optional email, uploaded invoices and the generated report.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Where it is processed</h2>
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="table">
              <thead><tr><th>Provider</th><th>Purpose</th><th>Location</th></tr></thead>
              <tbody>{PROCESSORS.map(([p, use, loc]) => <tr key={p}><td className="font-medium">{p}</td><td className="text-muted">{use}</td><td className="text-muted">{loc}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">Data processed outside Canada may be accessible to authorities in those jurisdictions.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">How we limit AI use</h2>
          <ul className="list-inside list-disc space-y-1 text-muted">
            <li>Documents are never sent to free-tier models. AI features are disabled unless a paid, no-training API tier is configured.</li>
            <li>Only the invoice text needed for extraction is sent. Banking details, card numbers and SINs are redacted first.</li>
            <li>Client data is never used to train models, by us or by our providers under their API terms.</li>
            <li>Nothing is emailed without a person at the agency reading and approving it.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Retention and deletion</h2>
          <ul className="list-inside list-disc space-y-1 text-muted">
            <li>Client data is kept for the life of the service agreement, then deleted within 30 days of termination unless the law requires longer retention.</li>
            <li>Cash Leak Scan data is deleted automatically 30 days after upload unless the prospect becomes a client.</li>
            <li>On request, we delete a client&apos;s records and documents within 30 days. Email the agency to request access, correction or deletion.</li>
            <li>Documents are stored in a private bucket and opened only through links that expire after five minutes.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Not legal advice</h2>
          <p className="text-muted">Holdback HQ is an administrative tool. Deadlines and reminders are not legal advice.</p>
        </section>
      </div>
    </main>
  );
}
