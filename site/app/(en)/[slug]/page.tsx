import PageView, { metadataOf, staticSlugs } from "../../components/PageView";

export const dynamicParams = false;
export const generateStaticParams = staticSlugs;
type Props = Readonly<{ params: Promise<{ slug: string }> }>;
export async function generateMetadata({ params }: Props) {
  return metadataOf("en", (await params).slug);
}
export default async function Page({ params }: Props) {
  return <PageView locale="en" slug={(await params).slug} />;
}
