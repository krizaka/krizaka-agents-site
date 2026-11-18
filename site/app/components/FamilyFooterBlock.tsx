import { FamilyFooter } from "@krizaka/ui/site-footer";
import { familyLabels } from "@krizaka/ui/sites";
import { footerFor } from "@krizaka/org";
import { getMessages, type Locale } from "@/lib/i18n";
import { contactUrl } from "@/lib/site";

/* The family footer (Products, Open source, Krizaka, legal line), drawn from the org data. The Contact line is the company's
   contact page with the topic already chosen. No social accounts here: the footer asked for is Products, Open source, Krizaka and the legal line. `krizaka` is the org's footer selection every public site shares. */
export default function FamilyFooterBlock({ locale }: Readonly<{ locale: Locale }>) {
  const t = getMessages(locale);
  const contact = { fr: contactUrl("fr"), en: contactUrl("en") };
  return (
    <div className="kz-footer">
      <p>{t.footer.status}</p>
      <p>{t.footer.code}</p>
      <FamilyFooter
        footer={{ ...footerFor("krizaka"), social: [] }}
        current="krizaka"
        labels={familyLabels[locale]}
        sourceLabel={t.footer.source}
        contact={contact}
        variant="site"
      />
    </div>
  );
}
