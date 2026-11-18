import { getMessages, type Locale } from "@/lib/i18n";
import { contactUrl } from "@/lib/site";

/** The way to write to us: one door, krizaka.com's contact form with the topic already chosen. No address, no promise but the one that is true. */
export default function WriteToUs({ locale }: Readonly<{ locale: Locale }>) {
  const t = getMessages(locale).contact;
  return (
    <aside className="kz-contact" data-write-to-us>
      <a className="kz-contact-link" href={contactUrl(locale)}>
        {t.label}
      </a>
      <p>{t.promise}</p>
    </aside>
  );
}
