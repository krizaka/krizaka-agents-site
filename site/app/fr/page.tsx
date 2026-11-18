import PageView, { metadataOf } from "../components/PageView";

export const generateMetadata = () => metadataOf("fr", undefined);
export default function Home() {
  return <PageView locale="fr" slug={undefined} />;
}
