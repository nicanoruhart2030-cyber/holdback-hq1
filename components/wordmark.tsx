export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-[26px] w-[26px] rounded-[7px] text-[13px]" : "h-[22px] w-[22px] rounded-md text-xs";
  return (
    <span className={`flex items-center gap-2 font-semibold tracking-[-0.015em] text-fg ${size === "lg" ? "text-base" : "text-[15px]"}`}>
      <span aria-hidden="true" className={`flex items-center justify-center bg-fg font-semibold text-ink ${box}`}>
        H
      </span>
      Holdback HQ
    </span>
  );
}
