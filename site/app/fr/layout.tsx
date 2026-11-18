import type { ReactNode } from "react";
import SiteRoot from "../components/SiteRoot";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteRoot locale="fr">{children}</SiteRoot>;
}
