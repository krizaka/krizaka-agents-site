import type { CSSProperties } from "react";
import { ArchitectureDiagram } from "@krizaka/ui/architecture-diagram";
import { getMessages, type Locale } from "@/lib/i18n";
import { viewOf, type ViewId } from "@/lib/views";

/** The drawing never shrinks below this share of its laid-out width: on a phone it scrolls sideways in its frame, readable. */
const MIN_SCALE = 0.7;

/* One architecture view where a page places it: @krizaka/ui's ArchitectureDiagram (both themes from the tokens, server-rendered,
   no script), the model's title, the caption the site decided, and the text version under it — open for a flow, so its numbered
   steps are a list a reader sees without opening anything. */
export default function ViewFigure({ locale, id }: Readonly<{ locale: Locale; id: ViewId }>) {
  const t = getMessages(locale).views;
  const view = viewOf(id, locale);
  const style = { "--kz-view-min": `${Math.round(view.bounds.width * MIN_SCALE)}px` } as CSSProperties;
  return (
    <div className="kz-view" data-view={id} style={style}>
      <ArchitectureDiagram view={view} subtitle={t.captions[id]} words={t.words} textOpen={view.dynamic} />
    </div>
  );
}
