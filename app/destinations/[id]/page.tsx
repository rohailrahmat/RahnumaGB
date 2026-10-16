import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Compass, MapPin, Mountain, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { destinations, getDestinationImage, guides } from "@/lib/data";
import { formatPKR } from "@/lib/data";
import { getOpenStreetMapEmbedUrl, getOpenStreetMapLocationUrl } from "@/lib/map";
import { YasinExplore } from "@/components/yasin-explore";

export function generateStaticParams() {
  return destinations.map((destination) => ({ id: destination.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const destination = destinations.find((item) => item.id === id);
  return destination
    ? { title: `${destination.name} | Rahnuma GB`, description: destination.overview }
    : { title: "Place", description: "Explore destinations across Gilgit-Baltistan with Rahnuma GB." };
}

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = destinations.find((item) => item.id === id);
  if (!destination) notFound();
  const localGuides = guides.filter((guide) => guide.districts.some((district) => destination.district.toLowerCase().includes(district.toLowerCase()))).slice(0, 2);

  return <>
    <SiteHeader />
    <main className="place-page">
      <section className="place-cover">
        <Image src={getDestinationImage(destination.id)} alt={destination.name} fill priority sizes="100vw" />
        <div className="place-cover-scrim" />
        <div className="place-cover-content page-width">
          <Link className="back-link" href="/destinations"><ArrowLeft size={15} /> ALL PLACES</Link>
          <div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> {destination.district.toUpperCase()} DISTRICT</div>
          <h1>{destination.name}</h1>
          <p>{destination.best_season}</p>
        </div>
      </section>
      <section className="place-overview page-width">
        <div className="place-main-copy"><div className="eyebrow"><span className="eyebrow-dot" /> THE FEEL OF IT</div><h2>A little closer<br /><em>to the extraordinary.</em></h2><p>{destination.overview}</p></div>
        <div className="place-facts">
          <div><Mountain size={18} /><span>ALTITUDE</span><strong>{destination.altitude_m.toLocaleString()} m</strong></div>
          <div><Compass size={18} /><span>BEST SEASON</span><strong>{destination.best_season}</strong></div>
          <div><MapPin size={18} /><span>DAILY ESTIMATE</span><strong>PKR {formatPKR(destination.cost_per_day_pkr)}</strong></div>
        </div>
      </section>
      {destination.id === "yasin" && <YasinExplore />}
      <section className="place-map-section page-width">
        <div className="place-map-heading">
          <div><div className="eyebrow"><span className="eyebrow-dot" /> GET YOUR BEARINGS</div><h2>Find {destination.name}<br /><em>on the map.</em></h2></div>
          <a href={getOpenStreetMapLocationUrl(destination)} target="_blank" rel="noreferrer">Open larger map <ArrowUpRight size={15} /></a>
        </div>
        <div className="place-map-frame">
          <iframe
            src={getOpenStreetMapEmbedUrl(destination)}
            title={`OpenStreetMap showing ${destination.name}`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <p className="map-attribution">Map data © OpenStreetMap contributors. The pin marks the approximate destination location.</p>
      </section>
      <section className="place-details page-width">
        <div className="place-detail-block"><span className="detail-index">01 / GETTING THERE</span><h2>The way in.</h2><p>{destination.how_to_reach}</p></div>
        <div className="place-detail-block"><span className="detail-index">02 / WHILE YOU’RE HERE</span><h2>Make a day of it.</h2><ul>{destination.activities.slice(0, 6).map((activity) => <li key={activity}>{activity}</li>)}</ul></div>
        <div className="place-detail-block place-safety"><ShieldCheck size={20} /><span className="detail-index">GOOD TO KNOW</span><p>{destination.safety}</p><strong>{destination.tips}</strong></div>
      </section>
      {localGuides.length > 0 && <section className="place-guides page-width"><div><div className="eyebrow"><span className="eyebrow-dot" /> PEOPLE WHO KNOW THE WAY</div><h2>Go with a <em>local.</em></h2></div><div className="place-guide-list">{localGuides.map((guide) => <a href={guide.whatsapp_url} target="_blank" rel="noreferrer" key={guide.id}><span>{guide.name}<small>{guide.title}</small></span><ArrowUpRight size={17} /></a>)}</div></section>}
      <section className="place-cta page-width"><p>Make this your starting point.</p><Link className="button button-dark" href={`/planner?interest=${encodeURIComponent(destination.name)}`}>Build a route <ArrowUpRight size={15} /></Link></section>
    </main>
  </>;
}