/* The share card (Open Graph) of one language, drawn at build time from the site's own faces and colours: the Cahier sheet
   (paper, blue ink, red margin), the title, the seven stations of the flow, the measured line, the mark and the address.
   The ttf files are those of @krizaka/fonts (SIL OFL 1.1), the same families as the pages. The colours are the Cahier light theme's tokens. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getMessages, type Locale } from "@/lib/i18n";
import { SHARE_SIZE } from "@/lib/site";

const PAPER = "#f3f5f1"; // --kz-surface-0, light: hsl(100 14% 96%)
const INK = "#1d3954"; // --kz-text-primary, light: hsl(212 49% 22%)
const INK_SOFT = "#3f5870"; // --kz-text-secondary, light: hsl(212 22% 32%)
const MARGIN = "#a53127"; // --kz-paper-rule-margin, light: hsl(5 62% 40%)
const FONTS = join(process.cwd(), "node_modules", "@krizaka", "fonts", "files", "native");
const face = (file: string) => readFileSync(join(FONTS, file));

function Station({ n, label, last }: Readonly<{ n: number; label: string; last: boolean }>) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", border: `2px solid ${INK}`, padding: "10px 14px", minWidth: 118 }}>
        <div style={{ display: "flex", fontFamily: "Courier Prime", fontSize: 18, color: MARGIN }}>{`${n}`}</div>
        <div style={{ display: "flex", fontFamily: "Atkinson", fontSize: 22, color: INK }}>{label}</div>
      </div>
      {!last && <div style={{ display: "flex", width: 14, height: 2, background: INK }} />}
    </div>
  );
}

export function shareCard(locale: Locale): ImageResponse {
  const s = getMessages(locale).share;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER }}>
        <div style={{ display: "flex", width: 4, height: "100%", background: MARGIN, marginLeft: 72 }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "48px 64px 44px 52px" }}>
          <div style={{ display: "flex", fontFamily: "Courier Prime", fontSize: 26, color: INK_SOFT }}>
            <svg width="30" height="30" viewBox="0 0 24 24" style={{ marginRight: 12 }}>
              <rect x="1" y="1" width="22" height="22" fill="none" stroke={INK} strokeWidth="2" />
              <path d="M7 5v14M7 12l9-7M7 12l9 7" fill="none" stroke={MARGIN} strokeWidth="2.4" />
            </svg>
            Krizaka
          </div>
          <div style={{ display: "flex", fontFamily: "Young Serif", fontSize: 68, lineHeight: 1.12, color: INK }}>{s.title}</div>
          <div style={{ display: "flex" }}>
            {s.strip.map((label, i) => (
              <Station key={label} n={i + 1} label={label} last={i === s.strip.length - 1} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontFamily: "Courier Prime", fontSize: 25, color: INK, maxWidth: 800 }}>{s.line}</div>
            <div style={{ display: "flex", fontFamily: "Atkinson", fontSize: 26, color: MARGIN }}>agents.krizaka.com</div>
          </div>
        </div>
      </div>
    ),
    {
      ...SHARE_SIZE,
      fonts: [
        { name: "Young Serif", data: face("YoungSerif-Regular.ttf"), weight: 400, style: "normal" },
        { name: "Atkinson", data: face("AtkinsonHyperlegibleNext-SemiBold.ttf"), weight: 600, style: "normal" },
        { name: "Courier Prime", data: face("CourierPrime-Regular.ttf"), weight: 400, style: "normal" },
      ],
    },
  );
}
