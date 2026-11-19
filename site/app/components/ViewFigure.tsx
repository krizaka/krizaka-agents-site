import { ArchitectureDiagram } from "@krizaka/ui/architecture-diagram";
import "@krizaka/ui/blocks.css";
import { getMessages, type Locale } from "@/lib/i18n";
import ViewScrollCue from "./ViewScrollCue";
import { viewOf, type ViewId } from "@/lib/views";

/* One architecture view where a page places it: @krizaka/ui's ArchitectureDiagram (its styles are the blocks', both themes from
   the tokens, server-rendered, no script; narrower than its readable size, it scrolls sideways in its own frame), the model's
   title, the caption the site decided, and the text version under it — open for a flow, so its numbered steps are a list a
   reader sees without opening anything. */
export default function ViewFigure({ locale, id }: Readonly<{ locale: Locale; id: ViewId }>) {
  const t = getMessages(locale).views;
  const view = viewOf(id, locale);
  return (
    <div className="kz-view" data-view={id}>
      <ArchitectureDiagram view={view} subtitle={t.captions[id]} words={t.words} textOpen={view.dynamic} />
      <ViewScrollCue text={t.scrollCue} />
    </div>
  );
}
