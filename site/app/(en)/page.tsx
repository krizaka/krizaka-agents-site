import PageView, { metadataOf } from "../components/PageView";

export const generateMetadata = () => metadataOf("en", undefined);
export default function Home() {
  return <PageView locale="en" slug={undefined} />;
}
