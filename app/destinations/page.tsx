import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DestinationBrowser } from "@/components/destination-browser";

export const metadata: Metadata = { title: "Places | Rehnuma GB" };

export default async function DestinationsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search = "" } = await searchParams;
  return <>
    <SiteHeader />
    <main className="inner-page">
      <section className="inner-hero page-width">
        <div className="eyebrow"><span className="eyebrow-dot" /> THE REGION, IN ITS OWN TIME</div>
        <h1>Places to <em>stay curious.</em></h1>
        <p>Ten valleys. A thousand ways to get there.</p>
      </section>
      <section className="directory-section page-width"><DestinationBrowser initialSearch={search} /></section>
    </main>
  </>;
}