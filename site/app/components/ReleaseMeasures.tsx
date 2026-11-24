import { getMessages, type Locale } from "@/lib/i18n";
import { readReleaseMeasures } from "@/lib/release-measures";

/** The measures section while its measure is not recorded: what it will show, the ticket it waits for, the command that records it. */
export default function ReleaseMeasures({ locale }: Readonly<{ locale: Locale }>) {
  const m = readReleaseMeasures();
  const t = getMessages(locale).release.measures;
  return (
    <section className="kz-measures" aria-label={t.heading}>
      <p>{t.pending.replace("{issue}", m.waitsFor.issue)}</p>
      <ul>
        {m.waitsFor.measures.map((id) => (
          <li key={id}>{t.names[id]}</li>
        ))}
      </ul>
      <p className="kz-measure-source">
        {t.recordedBy} <code>{m.waitsFor.command}</code>
      </p>
    </section>
  );
}
