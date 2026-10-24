"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ScanUploader() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) {
      setError("Add at least one invoice.");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.delete("files");
    for (const f of files) fd.append("files", f);
    try {
      const res = await fetch("/api/scan", { method: "POST", body: fd });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "Scan failed");
      router.push(`/scan/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="block"><span className="label mb-1.5 block">Prospect name</span><input name="prospect_name" required className="input" /></label>
        <label className="block"><span className="label mb-1.5 block">Company</span><input name="prospect_company" className="input" /></label>
        <label className="block"><span className="label mb-1.5 block">Email (optional)</span><input name="prospect_email" type="email" className="input" /></label>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); setFiles((f) => [...f, ...e.dataTransfer.files]); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        className={`cursor-pointer rounded-card border border-dashed px-6 py-8 text-center transition-colors ${dragging ? "border-accent bg-accent/[0.04]" : "border-line-strong hover:border-faint"}`}
      >
        <div className="text-sm">Drop up to 40 past invoices (PDF or images)</div>
        <div className="mt-1 text-xs text-muted">No account needed for the prospect. Files and results are deleted after 30 days unless converted.</div>
        <input ref={inputRef} name="files" type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden"
          onChange={(e) => { setFiles((f) => [...f, ...(e.target.files ?? [])]); e.target.value = ""; }} />
      </div>
      {files.length > 0 ? (
        <ul className="divide-y divide-line border-y border-line text-sm">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between py-2">
              <span className="truncate">{f.name}</span>
              <button type="button" className="text-xs text-muted hover:text-danger" onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}>Remove</button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? `Analysing ${files.length} files` : "Run Cash Leak Scan"}
      </button>
    </form>
  );
}
