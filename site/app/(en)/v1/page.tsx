import DraftPageView, { draftMetadataOf } from "../../components/DraftPageView";

export const generateMetadata = () => draftMetadataOf("en", "v1");

export default function V1DraftPage() {
  return <DraftPageView locale="en" slug="v1" />;
}
