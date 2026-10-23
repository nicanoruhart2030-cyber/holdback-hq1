import { NextResponse, type NextRequest } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { renderScanPdf } from "@/lib/scan/pdf";
import { createClient } from "@/lib/supabase/server";
import type { Scan } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const supabase = createClient();
    const { data: scan } = await supabase.from("scans").select("*").eq("id", params.id).maybeSingle<Scan>();
    if (!scan?.report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    const bytes = await renderScanPdf(scan);
    const name = `cash-leak-scan-${(scan.prospect_company ?? scan.prospect_name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
