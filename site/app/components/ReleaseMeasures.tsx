import { Badge } from "@krizaka/ui/badge";
import { getMessages, type Locale } from "@/lib/i18n";
import { measureSourceOf, readReleaseMeasures, type MeasureSource } from "@/lib/release-measures";

function SourceLine({ prefix, source }: Readonly<{ prefix: string; source: MeasureSource }>) {
  return (
    <p className="kz-measure-source">
      {prefix}: <code>{source.command}</code> ({source.date})
    </p>
  );
}

/** Renders the dated 1.0 release measures directly from content/release/measures.json with sources and context. */
export default function ReleaseMeasures({ locale }: Readonly<{ locale: Locale }>) {
  const m = readReleaseMeasures();
  const t = getMessages(locale).release.measures;
  const statsSource = measureSourceOf(m, "daily");
  const totalsSource = measureSourceOf(m, "totals");
  const beforeSource = measureSourceOf(m, "towerBeforeAfter");
  const kindsSource = measureSourceOf(m, "topAlertKinds");
  const hours = String(m.windowHours.value);

  const summaryFacts = [
    [m.totals.merges, t.totals.merges],
    [m.totals.redsFixed, t.totals.redsFixed],
    [m.totals.timeToGreenMedianMinutes, t.totals.timeToGreen],
    [m.totals.alertsRaised, t.totals.alertsRaised],
    [m.totals.towerWakes, t.totals.towerWakes],
    [m.totals.loopsCaught, t.totals.loopsCaught],
  ] as const;

  const beforeRows = [
    [t.beforeMetrics.alerts, m.towerBeforeAfter.before.alerts],
    [t.beforeMetrics.teamEnded, m.towerBeforeAfter.before.teamEnded],
    [t.beforeMetrics.crack, m.towerBeforeAfter.before.crack],
    [t.beforeMetrics.needsOwner, m.towerBeforeAfter.before.needsOwner],
    [t.beforeMetrics.teamEndedAckedByHand, m.towerBeforeAfter.before.teamEndedAckedByHand],
  ] as const;

  return (
    <section className="kz-measures" aria-label={t.dailyHeading}>
      <aside className="kz-measure-context">
        <p>
          <strong>{t.lanesOffTitle}</strong> — {t.lanesOffNote.replace("{date}", m.lanesOffSince)}
        </p>
      </aside>

      <div className="kz-measure-block">
        <h4>{t.totalsHeading.replace("{hours}", hours)}</h4>
        <dl className="kz-hero-facts">
          {summaryFacts.map(([value, label]) => (
            <div key={label}>
              <dt>{value}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
        <SourceLine prefix={t.sourcePrefix} source={totalsSource} />
      </div>

      <div className="kz-measure-block">
        <h4>{t.dailyHeading}</h4>
        <p className="kz-measure-note">
          {t.dailyCaption.replace("{target}", String(m.daily.targetPerDay)).replace("{hours}", hours)}
        </p>
        <div className="kz-table-scroll">
          <table className="kz-table">
            <thead>
              <tr>
                <th scope="col">{t.columns.day}</th>
                <th scope="col">{t.columns.alertsSent}</th>
                <th scope="col">{t.columns.ctoWakeups}</th>
                <th scope="col">{t.columns.towerRuns}</th>
                <th scope="col">{t.columns.lanes}</th>
                <th scope="col">{t.columns.target}</th>
              </tr>
            </thead>
            <tbody>
              {m.daily.days.map((d) => (
                <tr key={d.date}>
                  <td>
                    <code>{d.date}</code>
                    {d.partial ? (
                      <>
                        {" "}
                        <Badge tone="warning" size="sm">
                          {t.partialTag}
                        </Badge>
                      </>
                    ) : null}
                  </td>
                  <td>{d.alertsSent}</td>
                  <td>{d.ctoWakeups}</td>
                  <td>{d.towerRuns}</td>
                  <td>{t.laneStates[d.lanes]}</td>
                  <td>{m.daily.targetPerDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceLine prefix={t.sourcePrefix} source={statsSource} />
      </div>

      <div className="kz-measure-block">
        <h4>{t.beforeAfterHeading.replace("{window}", m.towerBeforeAfter.before.window)}</h4>
        <p className="kz-measure-note">{t.beforeAfterNote}</p>
        <div className="kz-table-scroll">
          <table className="kz-table">
            <thead>
              <tr>
                <th scope="col">{t.beforeColumns.metric}</th>
                <th scope="col">{t.beforeColumns.before.replace("{window}", m.towerBeforeAfter.before.window)}</th>
                <th scope="col">{t.beforeColumns.after}</th>
              </tr>
            </thead>
            <tbody>
              {beforeRows.map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{value}</td>
                  <td>{t.notRunYet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceLine prefix={t.sourcePrefix} source={beforeSource} />
      </div>

      <div className="kz-measure-block">
        <h4>{t.topKindsHeading}</h4>
        <div className="kz-table-scroll">
          <table className="kz-table">
            <thead>
              <tr>
                <th scope="col">{t.topKindsColumns.kind}</th>
                <th scope="col">{t.topKindsColumns.rows}</th>
                <th scope="col">{t.topKindsColumns.occurrences}</th>
                <th scope="col">{t.topKindsColumns.status}</th>
              </tr>
            </thead>
            <tbody>
              {m.topAlertKinds.rows.map((row) => (
                <tr key={row.kind}>
                  <td>
                    <code>{row.kind}</code>
                  </td>
                  <td>{row.rows}</td>
                  <td>{row.occurrences}</td>
                  <td>
                    <Badge tone={row.status === "tuned" ? "success" : "neutral"} size="sm">
                      {t.kindStatuses[row.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceLine prefix={t.sourcePrefix} source={kindsSource} />
      </div>

      <div className="kz-measure-block">
        <h4>{t.ciMinutesHeading}</h4>
        <p className="kz-measure-note">{t.ciMinutesUnavailable}</p>
      </div>
    </section>
  );
}
