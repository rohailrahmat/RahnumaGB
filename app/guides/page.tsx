import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { GuideBrowser } from "@/components/guide-browser";

export const metadata: Metadata = {
  title: "Local guides | Rahnuma GB",
  description: "Meet local Gilgit-Baltistan guides and plan your journey with people who know the region.",
};

export default function GuidesPage() {
  return <><SiteHeader /><main className="inner-page"><section className="inner-hero page-width"><div className="eyebrow"><span className="eyebrow-dot" /> THE PEOPLE WHO MAKE THE PLACE</div><h1>Local knowledge.<br /><em>Human connection.</em></h1><p>Meet certified guides from across the region.</p></section><section className="directory-section page-width"><GuideBrowser /></section></main></>;
}