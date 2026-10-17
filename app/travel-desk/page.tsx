import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, CalendarDays, CloudSun, Coins, Hotel, Route, ShieldAlert } from "lucide-react";
import { RegionalWeather } from "@/components/regional-weather";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Travel desk | Rahnuma GB",
  description: "Check regional weather and find official Gilgit-Baltistan travel advisories, emergency contacts and visitor services.",
};

const officialResources = [
  {
    title: "Travel updates",
    description: "Review current notices and travel information from the Gilgit-Baltistan Tourism Department.",
    href: "https://e-tourism.visitgilgitbaltistan.gov.pk/plan-trip/news-and-updates",
    Icon: Route,
    tag: "Before you travel",
  },
  {
    title: "Emergency contacts",
    description: "Open the official directory for current emergency and visitor-support contacts.",
    href: "https://e-tourism.visitgilgitbaltistan.gov.pk/plan-trip/emergency",
    Icon: ShieldAlert,
    tag: "Keep it handy",
  },
  {
    title: "Tour operators",
    description: "Browse tourism department information about registered local tour operators.",
    href: "https://e-tourism.visitgilgitbaltistan.gov.pk/plan-trip/operators",
    Icon: BadgeCheck,
    tag: "Local services",
  },
  {
    title: "Hotels & resorts",
    description: "Find official accommodation listings; confirm rates, availability and facilities directly.",
    href: "https://e-tourism.visitgilgitbaltistan.gov.pk/plan-trip/hotels-and-resorts",
    Icon: Hotel,
    tag: "Places to stay",
  },
  {
    title: "Currency information",
    description: "Check the official currency resource for the latest published information.",
    href: "https://e-tourism.visitgilgitbaltistan.gov.pk/plan-trip/currency",
    Icon: Coins,
    tag: "Plan your budget",
  },
  {
    title: "Festivals & events",
    description: "Explore regional celebrations and events; dates and access can change from year to year.",
    href: "https://e-tourism.visitgilgitbaltistan.gov.pk/festivals-and-events",
    Icon: CalendarDays,
    tag: "Culture & calendar",
  },
];

export default function TravelDeskPage() {
  return <>
    <SiteHeader />
    <main className="inner-page travel-desk-page">
      <section className="inner-hero page-width">
        <div className="eyebrow"><span className="eyebrow-dot" /> USEFUL TO KNOW, BEFORE YOU GO</div>
        <h1>Your northbound<br /><em>travel desk.</em></h1>
        <p>Live forecasts and official visitor resources, gathered in one practical place.</p>
      </section>

      <section className="travel-weather-section page-width" aria-labelledby="regional-weather-title">
        <div className="travel-section-heading">
          <div><div className="eyebrow"><CloudSun size={14} /> CONDITIONS AT A GLANCE</div><h2 id="regional-weather-title">A little closer to <em>the sky.</em></h2></div>
          <p>Forecasts are modelled estimates, not official road or safety advisories. Mountain weather can change quickly.</p>
        </div>
        <RegionalWeather />
        <p className="travel-data-note">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. For the tourism department’s district weather page, <a href="https://e-tourism.visitgilgitbaltistan.gov.pk/plan-trip/weather" target="_blank" rel="noreferrer">visit the official portal <ArrowUpRight size={12} /></a>.</p>
      </section>

      <section className="travel-resources-section">
        <div className="page-width">
          <div className="travel-section-heading">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> OFFICIAL VISITOR RESOURCES</div><h2>Good to have<br /><em>within reach.</em></h2></div>
            <p>Current contacts, notices and listings live on the tourism department’s portal. Check there for the latest details before setting out.</p>
          </div>
          <div className="travel-resource-grid">
            {officialResources.map(({ title, description, href, Icon, tag }) => <a className="travel-resource-card" href={href} target="_blank" rel="noreferrer" key={title}>
              <span className="travel-resource-icon"><Icon size={19} strokeWidth={1.5} /></span>
              <span className="travel-resource-tag">{tag}</span>
              <strong>{title}</strong>
              <p>{description}</p>
              <span className="travel-resource-link">Open official resource <ArrowUpRight size={14} /></span>
            </a>)}
          </div>
        </div>
      </section>

      <section className="travel-planning-cta page-width">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> MAKE A PLAN THAT CAN FLEX</span><h2>Ready to shape<br /><em>your route?</em></h2></div>
        <p>Build a day-by-day itinerary around your pace, interests and the valleys you want to discover.</p>
        <Link href="/planner" className="button button-dark">Open trip planner <ArrowUpRight size={15} /></Link>
      </section>
    </main>
    <footer className="travel-desk-footer"><div className="page-width"><span>© {new Date().getFullYear()} RAHNUMA GB</span><span>For official updates, consult the <a href="https://e-tourism.visitgilgitbaltistan.gov.pk/" target="_blank" rel="noreferrer">Gilgit-Baltistan Tourism Department <ArrowUpRight size={12} /></a>.</span></div></footer>
  </>;
}
