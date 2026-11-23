import { getMessages, type Locale } from "@/lib/i18n";
import { aliasSummary, readMigrationAliases, type MigrationAlias } from "@/lib/migration-aliases";

function AliasTable({
  heading,
  rows,
  columns,
}: Readonly<{
  heading: string;
  rows: readonly MigrationAlias[];
  columns: { oldName: string; newName: string; rolePrefix: string };
}>) {
  return (
    <div className="kz-measure-block">
      <h4>{heading}</h4>
      <div className="kz-table-scroll">
        <table className="kz-table">
          <thead>
            <tr>
              <th scope="col">{columns.oldName}</th>
              <th scope="col">{columns.newName}</th>
              <th scope="col">{columns.rolePrefix}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.oldName}>
                <td>
                  <code>{row.oldName}</code>
                </td>
                <td>
                  <code>{row.newName}</code>
                </td>
                <td>
                  <code>{row.rolePrefix}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Renders the complete old -> new environment variable alias tables directly from content/release/migration-aliases.json. */
export default function MigrationAliases({ locale }: Readonly<{ locale: Locale }>) {
  const data = readMigrationAliases();
  const summary = aliasSummary(data.aliases);
  const t = getMessages(locale).migration;

  const providerRows = data.aliases.filter((a) => a.kind === "provider-to-role");
  const prefixRows = data.aliases.filter((a) => a.kind === "prefix-rename");
  const facts = [
    [summary.total, t.summary.total],
    [summary.byKind["provider-to-role"], t.summary.providerToRole],
    [summary.byKind["prefix-rename"], t.summary.prefixRename],
  ] as const;

  const sourceLine = t.sourceLabel
    .replace("{repo}", data.source.repository)
    .replace("{file}", data.source.file)
    .replace("{date}", data.source.date);

  return (
    <section className="kz-aliases" aria-label={t.prefixHeading}>
      <p className="kz-measure-source">{sourceLine}</p>
      <dl className="kz-hero-facts">
        {facts.map(([count, label]) => (
          <div key={label}>
            <dt>{count}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>

      <AliasTable heading={t.providerHeading} rows={providerRows} columns={t.columns} />
      <AliasTable heading={t.prefixHeading} rows={prefixRows} columns={t.columns} />
    </section>
  );
}
