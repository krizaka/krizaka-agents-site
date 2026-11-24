import { ArchitectureDiagram } from "@krizaka/ui/architecture-diagram";
import "@krizaka/ui/blocks.css";
import { getMessages, type Locale } from "@/lib/i18n";
import { releaseModelSource, releaseViewOf, type ReleaseViewId } from "@/lib/release-diagrams";
import ViewScrollCue from "./ViewScrollCue";

/** Renders one 1.0 architecture diagram generated from the copied LikeC4 model, with its source provenance. */
export default function ReleaseViewFigure({ locale, id }: Readonly<{ locale: Locale; id: ReleaseViewId }>) {
  const m = getMessages(locale);
  const view = releaseViewOf(id, locale);
  const meta = releaseModelSource();
  const sourceNote = m.release.modelSource
    .replace("{repo}", meta.source.repository)
    .replace("{path}", meta.source.path)
    .replace("{date}", meta.source.copiedDate);

  return (
    <div className="kz-view" data-view={id}>
      <ArchitectureDiagram view={view} subtitle={m.release.captions[id]} words={m.views.words} textOpen={view.dynamic} />
      <ViewScrollCue text={m.views.scrollCue} />
      <p className="kz-view-source">{sourceNote}</p>
    </div>
  );
}
