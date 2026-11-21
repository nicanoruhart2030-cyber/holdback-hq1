/**
 * TODO: logo file — this typeset wordmark stands in until a logo exists.
 * When it does, put it in /public and render it here (keep the accessible name).
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[1.0625rem] font-extrabold tracking-[-0.02em] text-fg ${className}`}>
      Grow<span className="text-accent">Fit</span>Consult
    </span>
  );
}
