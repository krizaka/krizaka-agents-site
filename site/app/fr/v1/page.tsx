import DraftPageView, { draftMetadataOf } from "../../components/DraftPageView";

export const generateMetadata = () => draftMetadataOf("fr", "v1");

export default function V1DraftPageFr() {
  return <DraftPageView locale="fr" slug="v1" />;
}
