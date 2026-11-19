import { getMessages, type Locale } from "@/lib/i18n";
import { contactUrl } from "@/lib/site";

/** The way to write to us: one door, krizaka.com's contact form with the topic already chosen. No address, no promise but the one that is true.
    `invite` adds the sentence that says who should write and what to write (the end of every page); without it, the button alone (the first screen of the home). */
export default function WriteToUs({ locale, invite = false }: Readonly<{ locale: Locale; invite?: boolean }>) {
  const t = getMessages(locale).contact;
  return (
    <aside className="kz-contact" data-write-to-us={invite ? "end" : "top"}>
      {invite && <p className="kz-contact-invite">{t.invite}</p>}
      <a className="kz-contact-link" href={contactUrl(locale)}>
        {t.label}
      </a>
      <p>{t.promise}</p>
    </aside>
  );
}
