import { ImageResponse } from "next/og";
import { dictionaries } from "@/lib/i18n/dictionary";
import { site } from "@/lib/site";

export const alt = dictionaries.en.meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Syne 800, subset to the characters drawn. Falls back to the default face if the fetch fails. */
async function loadSyne(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Syne:wght@800&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const headline = dictionaries.en.hero.title;
  const strap = "30 years · 8 countries · SVP-led integrations";
  const font = await loadSyne(`GrowFitConsult${headline}${strap} ${site.founder}`);
  // Explicit lines: the last line carries the accent full stop, so it can never wrap away
  const words = headline.replace(/\.$/, "").split(" ");
  const lines = [words.slice(0, 1).join(" "), words.slice(1).join(" ")];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080810",
          color: "#EDEDF2",
          padding: "72px 80px",
          border: "1px solid rgba(237,237,242,0.09)",
        }}
      >
        <div style={{ display: "flex", fontFamily: font ? "Syne" : undefined, fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Grow<span style={{ color: "#00E5A0" }}>Fit</span>Consult
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: font ? "Syne" : undefined,
              fontSize: 104,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            <div style={{ display: "flex" }}>{lines[0]}</div>
            <div style={{ display: "flex" }}>
              {lines[1]}
              <span style={{ color: "#00E5A0" }}>.</span>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 36, paddingTop: 28, borderTop: "1px solid rgba(237,237,242,0.2)", fontSize: 21, color: "#9A9AA8", fontFamily: font ? "Syne" : undefined, letterSpacing: "-0.01em" }}>
            {strap} · {site.founder}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Syne", data: font, weight: 800, style: "normal" }] : undefined,
    },
  );
}
