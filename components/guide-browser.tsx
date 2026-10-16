"use client";

import { ArrowUpRight, Search, ShieldCheck, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { guides } from "@/lib/data";

export function GuideBrowser() {
  const [query, setQuery] = useState("");
  const visibleGuides = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return guides.filter((guide) => !normalized || `${guide.name} ${guide.region} ${guide.specialties.join(" ")}`.toLowerCase().includes(normalized));
  }, [query]);

  return <>
    <label className="directory-search guide-search"><Search size={17} /><span className="sr-only">Search local guides</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by place or specialty…" /></label>
    <div className="guide-grid">
      {visibleGuides.map((guide, index) => <article className="guide-card" key={guide.id}>
        <div className="guide-card-head"><span className="guide-avatar">{guide.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span className="guide-number">GUIDE / {String(index + 1).padStart(2, "0")}</span><span className="guide-rating"><Star size={13} fill="currentColor" /> {guide.rating.toFixed(1)}</span></div>
        <div className="guide-card-body"><span className="guide-region">{guide.region.toUpperCase()}</span><h2>{guide.name}</h2><p className="guide-title">{guide.title}</p><p>{guide.bio}</p><div className="guide-tags">{guide.specialties.slice(0, 2).map((specialty) => <span key={specialty}>{specialty}</span>)}</div><div className="guide-credential"><ShieldCheck size={15} /> {guide.license}</div></div>
        <div className="guide-card-foot"><span>FROM <strong>PKR {guide.daily_rate_pkr.toLocaleString()}</strong> / DAY</span><a href={guide.whatsapp_url} target="_blank" rel="noreferrer" aria-label={`Contact ${guide.name} on WhatsApp`}>Meet your guide <ArrowUpRight size={15} /></a></div>
      </article>)}
    </div>
    {!visibleGuides.length && <div className="empty-state"><h2>No guides match that search.</h2><p>Try a valley name or activity.</p></div>}
  </>;
}