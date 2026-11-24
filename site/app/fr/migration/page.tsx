import DraftPageView, { draftMetadataOf } from "../../components/DraftPageView";

export const generateMetadata = () => draftMetadataOf("fr", "migration");

export default function MigrationDraftPageFr() {
  return <DraftPageView locale="fr" slug="migration" />;
}
