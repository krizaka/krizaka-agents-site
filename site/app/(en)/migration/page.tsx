import DraftPageView, { draftMetadataOf } from "../../components/DraftPageView";

export const generateMetadata = () => draftMetadataOf("en", "migration");

export default function MigrationDraftPage() {
  return <DraftPageView locale="en" slug="migration" />;
}
