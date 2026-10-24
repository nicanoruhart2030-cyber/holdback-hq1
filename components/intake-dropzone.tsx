"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { saveInvoiceAction } from "@/app/(app)/actions";
import { LOW_CONFIDENCE } from "@/lib/ai/confidence";
import type { InvoiceExtraction } from "@/lib/ai/schemas";

interface IntakeResult {
  path: string;
  previewUrl: string | null;
  mime: string;
  fileName: string;
  fields: InvoiceExtraction;
  confidence: number;
  textMethod: string;
  notes: string[];
  suggestedProjectId: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
  gc_name: string;
}

type Queue = Array<{ file: File; state: "queued" | "uploading" | "review" | "saved" | "error"; result?: IntakeResult; error?: string }>;

export function IntakeDropzone({ clientId, projects }: { clientId: string; projects: ProjectOption[] }) {
  const [queue, setQueue] = useState<Queue>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const process = useCallback(
    async (files: File[]) => {
      const start = queue.length;
      setQueue((q) => [...q, ...files.map((file) => ({ file, state: "queued" as const }))]);
      for (let i = 0; i < files.length; i += 1) {
        const idx = start + i;
        setQueue((q) => q.map((item, j) => (j === idx ? { ...item, state: "uploading" } : item)));
        const body = new FormData();
        body.append("file", files[i] as File);
        body.append("clientId", clientId);
        try {
          const res = await fetch("/api/intake", { method: "POST", body });
          const data = (await res.json()) as IntakeResult & { error?: string };
          if (!res.ok) throw new Error(data.error ?? "Upload failed");
          setQueue((q) => q.map((item, j) => (j === idx ? { ...item, state: "review", result: data } : item)));
        } catch (err) {
          setQueue((q) => q.map((item, j) => (j === idx ? { ...item, state: "error", error: err instanceof Error ? err.message : "Upload failed" } : item)));
        }
      }
    },
    [clientId, queue.length],
  );

  const active = queue.findIndex((q) => q.state === "review");
  const current = active >= 0 ? queue[active] : undefined;

  return (
    <section className="card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold">Invoice intake</h2>
        <span className="text-xs text-muted">PDF or image · extracted fields are never saved until you confirm</span>
      </div>
      <div className="p-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void process([...e.dataTransfer.files]);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-card border border-dashed px-6 py-8 text-center transition-colors ${
            dragging ? "border-accent bg-accent/[0.04]" : "border-line-strong hover:border-faint"
          }`}
        >
          <div className="text-sm text-fg">Drop invoices here or click to choose files</div>
          <div className="mt-1 text-xs text-muted">Stored in a private bucket. Only the invoice text needed for extraction is sent to the model.</div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              void process([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </div>

        {queue.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
            {queue.map((item, i) => (
              <li key={`${item.file.name}-${i}`} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate">{item.file.name}</span>
                <span className={`text-xs ${item.state === "error" ? "text-danger" : item.state === "saved" ? "text-accent" : "text-muted"}`}>
                  {item.state === "error" ? item.error : item.state === "uploading" ? "Extracting" : item.state}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {current?.result ? (
          <ReviewPanel
            key={current.result.path}
            result={current.result}
            projects={projects}
            onDone={(state) => {
              setQueue((q) => q.map((item, j) => (j === active ? { ...item, state } : item)));
              router.refresh();
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

function ReviewPanel({
  result,
  projects,
  onDone,
}: {
  result: IntakeResult;
  projects: ProjectOption[];
  onDone: (state: "saved" | "error") => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const f = result.fields;
  const low = (k: keyof InvoiceExtraction) => f[k].value === null || f[k].confidence < LOW_CONFIDENCE;
  const val = (k: keyof InvoiceExtraction) => {
    const v = f[k].value;
    return v === null || typeof v === "boolean" ? "" : String(v);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await saveInvoiceAction(new FormData(e.currentTarget));
    setSaving(false);
    if (res.ok) onDone("saved");
    else setError(res.error);
  }

  const input = (name: string, key: keyof InvoiceExtraction, type = "text", extra: Record<string, string> = {}) => (
    <label className="block">
      <span className="label mb-1.5 flex items-center justify-between">
        <span>{name}</span>
        <span className={`num normal-case tracking-normal ${low(key) ? "text-warn" : "text-faint"}`}>
          {f[key].value === null ? "not found" : `${Math.round(f[key].confidence * 100)}%`}
        </span>
      </span>
      <input name={key} type={type} defaultValue={val(key)} className={`input ${type !== "text" || key === "invoice_number" ? "num" : ""} ${low(key) ? "input-low" : ""}`} {...extra} />
    </label>
  );

  return (
    <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="min-h-[520px] overflow-hidden rounded-card border border-line bg-ink">
        {result.previewUrl ? (
          result.mime === "application/pdf" ? (
            <iframe src={result.previewUrl} title={result.fileName} className="h-full min-h-[520px] w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.previewUrl} alt={result.fileName} className="h-full w-full object-contain" />
          )
        ) : (
          <div className="p-6 text-sm text-muted">Preview unavailable.</div>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Confirm extracted fields</div>
            <div className="text-xs text-muted">
              {result.fileName} · text via {result.textMethod} · overall <span className="num">{Math.round(result.confidence * 100)}%</span>
            </div>
          </div>
        </div>
        {result.notes.map((n) => (
          <p key={n} className="border-l-2 border-warn pl-3 text-xs text-warn">{n}</p>
        ))}
        <p className="text-xs text-muted">Fields outlined in amber are low confidence or missing. Check them against the document.</p>

        <input type="hidden" name="source_file_path" value={result.path} />
        <input type="hidden" name="extraction_confidence" value={String(result.confidence)} />

        <label className="block">
          <span className="label mb-1.5 flex justify-between">
            <span>Project</span>
            {f.gc_name.value ? <span className="normal-case tracking-normal text-faint">billed to: {f.gc_name.value}</span> : null}
          </span>
          <select name="project_id" required defaultValue={result.suggestedProjectId ?? ""} className={`input ${result.suggestedProjectId ? "" : "input-low"}`}>
            <option value="" disabled>Choose project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.gc_name}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label mb-1.5 flex justify-between"><span>Invoice number</span><Conf f={f} k="invoice_number" /></span>
            <input name="number" required defaultValue={val("invoice_number")} className={`input num ${low("invoice_number") ? "input-low" : ""}`} />
          </label>
          <label className="block">
            <span className="label mb-1.5 block">Status</span>
            <select name="status" defaultValue={f.paid.value ? "paid" : "submitted"} className="input">
              <option value="draft">Draft</option><option value="submitted">Submitted</option><option value="partial">Partial</option>
              <option value="paid">Paid</option><option value="disputed">Disputed</option>
            </select>
          </label>
          {input("Amount (pre-tax)", "amount", "number", { step: "0.01", min: "0", required: "true" })}
          {input("Tax (HST)", "tax", "number", { step: "0.01", min: "0" })}
          {input("Issue date", "issue_date", "date")}
          {input("Submitted date", "submitted_date", "date")}
          {input("Due date", "due_date", "date")}
          {input("Amount paid", "amount_paid", "number", { step: "0.01", min: "0" })}
        </div>
        <p className="text-xs text-muted">Leave due date blank to use the statutory payment window from the submitted date.</p>
        <label className="block">
          <span className="label mb-1.5 block">Notes</span>
          <textarea name="notes" rows={2} className="input" />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving" : "Save invoice"}</button>
          <button type="button" className="btn-secondary" onClick={() => onDone("error")}>Skip</button>
        </div>
      </form>
    </div>
  );
}

function Conf({ f, k }: { f: InvoiceExtraction; k: keyof InvoiceExtraction }) {
  const low = f[k].value === null || f[k].confidence < LOW_CONFIDENCE;
  return (
    <span className={`num normal-case tracking-normal ${low ? "text-warn" : "text-faint"}`}>
      {f[k].value === null ? "not found" : `${Math.round(f[k].confidence * 100)}%`}
    </span>
  );
}
