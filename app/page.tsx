import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, MapPin, MessageCircle, Mountain, MoveUpRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { destinations, getDestinationImage } from "@/lib/data";
import { formatPKR } from "@/lib/data";

const featured = ["hunza", "skardu", "yasin", "ishkoman"]
  .map((id) => destinations.find((destination) => destination.id === id))
  .filter((destination) => destination !== undefined);

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <section className="hero">
          <Image className="hero-image" src="/static/images/hero.webp" alt="Cherry blossoms and the Karakoram mountains above a river valley" fill priority loading="eager" sizes="100vw" />
          <div className="hero-scrim" />
          <div className="hero-content page-width">
            <div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> THE NORTHERN FRONTIER, WELL FOUND</div>
            <h1><span>Rahnuma</span><em>GB</em></h1>
            <p className="hero-lede">Find your way into<br className="hero-mobile-break" /> the mountains.</p>
            <p className="hero-description">Local knowledge for the landscapes that stay with you.</p>
            <form className="hero-search" action="/destinations" method="get">
              <MapPin size={19} aria-hidden="true" />
              <label className="sr-only" htmlFor="destination-search">Where do you want to go?</label>
              <input id="destination-search" name="search" placeholder="Try Yasin, Ishkoman, Hunza, Skardu…" />
              <button type="submit" aria-label="Search destinations"><ArrowRight size={19} /></button>
            </form>
            <div className="hero-footnote"><span>35°55′ N&nbsp; 74°18′ E</span><span>GILGIT–BALTISTAN, PAKISTAN</span></div>
          </div>
          <Link className="hero-scroll" href="#discover" aria-label="Scroll to discover"><ArrowDownRight size={18} /></Link>
          <div className="hero-side-note">KARAKORAM · HIMALAYA · HINDU KUSH</div>
        </section>

        <section className="intro-band page-width" id="discover">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> A DIFFERENT KIND OF GUIDE</div>
            <h2>More than a map.<br /><em>A sense of place.</em></h2>
          </div>
          <div className="intro-aside">
            <p>Thoughtful routes, mountain-tested advice and the people who know these valleys by heart.</p>
            <Link className="text-link" href="/destinations">Explore the region <ArrowUpRight size={15} /></Link>
          </div>
          <div className="intro-stat"><strong>10</strong><span>VALLEYS<br />TO WANDER</span></div>
          <div className="intro-stat"><strong>4,114<span>m</span></strong><span>DEOSAI<br />PLATEAU</span></div>
        </section>

        <section className="destination-section">
          <div className="page-width">
            <div className="section-heading">
              <div><div className="eyebrow"><span className="eyebrow-dot" /> GO WHERE THE ROAD OPENS</div><h2>Find your <em>north.</em></h2></div>
              <Link className="text-link" href="/destinations">All destinations <ArrowUpRight size={15} /></Link>
            </div>
            <div className="destination-grid">
              {featured.map((destination, index) => (
                <Link className={`destination-card destination-card-${index + 1}`} href={`/destinations/${destination.id}`} key={destination.id}>
                  <Image src={getDestinationImage(destination.id)} alt={destination.name} fill sizes="(max-width: 760px) 90vw, 45vw" />
                  <span className="card-index">0{index + 1} / 04</span>
                  <span className="card-arrow"><ArrowUpRight size={17} /></span>
                  <span className="destination-card-copy">
                    <span>{destination.district.toUpperCase()} · {destination.altitude_m.toLocaleString()} M</span>
                    <strong>{destination.name}</strong>
                    <small>From PKR {formatPKR(destination.cost_per_day_pkr)} / day</small>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="planner-band page-width">
          <div className="planner-mark"><Mountain size={34} strokeWidth={1.2} /></div>
          <div className="planner-copy"><div className="eyebrow eyebrow-light"><Sparkles size={13} /> MADE FOR YOUR KIND OF JOURNEY</div><h2>Let the right route<br /><em>find you.</em></h2></div>
          <p>Tell us when, how far and what calls you north. We’ll help you shape the days in between.</p>
          <Link className="button button-light" href="/planner">Plan a journey <MoveUpRight size={16} /></Link>
          <div className="planner-number">01<span> / 03</span></div>
        </section>

        <section className="planner-band assistant-home-band page-width">
          <div className="planner-mark"><MessageCircle size={32} strokeWidth={1.2} /></div>
          <div className="planner-copy"><div className="eyebrow eyebrow-light"><Sparkles size={13} /> LOCAL KNOWLEDGE, WHEN YOU NEED IT</div><h2>Ask the guide<br /><em>who knows north.</em></h2></div>
          <p>Get thoughtful answers about destinations, routes and the details that make a journey easier.</p>
          <Link className="button button-light" href="/assistant">Ask Rahnuma <MoveUpRight size={16} /></Link>
          <div className="planner-number">02<span> / 03</span></div>
        </section>

        <footer className="site-footer">
          <div className="footer-inner page-width">
            <div className="footer-brand">
              <Link className="brand-lockup" href="/" aria-label="Rahnuma GB home">
                <Image className="brand-mark" src="/static/rehnuma-mark.webp?v=2" alt="" width={40} height={40} unoptimized />
                <span className="brand-copy"><strong>RAHNUMA</strong><small>GILGIT–BALTISTAN</small></span>
              </Link>
              <p>Local knowledge for the landscapes that stay with you. Made with respect for the mountains and the people who call them home.</p>
            </div>
            <nav className="footer-links" aria-label="Explore Rahnuma">
              <div><strong>Explore</strong><Link href="/destinations">Destinations</Link><Link href="/guides">Local guides</Link><Link href="/planner">Trip planner</Link></div>
              <div><strong>Your journey</strong><Link href="/assistant">Ask Rahnuma</Link><Link href="/login">Sign in</Link><Link href="/register">Create an account</Link></div>
            </nav>
            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} RAHNUMA GB</span>
              <span>TRAVEL THOUGHTFULLY · GILGIT–BALTISTAN, PAKISTAN</span>
              <Link href="#top">Back to top ↑</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}