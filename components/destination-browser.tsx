"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { destinations, getDestinationImage } from "@/lib/data";
import type { Destination } from "@/lib/types";
import { formatPKR } from "@/lib/data";

const filters = ["All places", "Valleys", "High country", "Quiet places"];

function matchesFilter(destination: Destination, filter: string) {
  if (filter === "Valleys") return !["deosai", "fairy-meadows"].includes(destination.id);
  if (filter === "High country") return ["deosai", "fairy-meadows"].includes(destination.id);
  if (filter === "Quiet places") return destination.hidden_gem;
  return true;
}

export function DestinationBrowser({ initialSearch = "" }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState("All places");
  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return destinations.filter((destination) => {
      const matchesSearch = !query || `${destination.name} ${destination.district} ${destination.overview}`.toLowerCase().includes(query);
      return matchesSearch && matchesFilter(destination, filter);
    });
  }, [search, filter]);

  return (
    <>
      <div className="directory-tools">
        <label className="directory-search">
          <Search size={17} />
          <span className="sr-only">Search destinations</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search valleys, districts…" />
        </label>
        <span className="directory-count">{results.length} PLACES</span>
      </div>
      <div className="filter-row" aria-label="Destination categories">
        <span className="filter-icon"><SlidersHorizontal size={14} /></span>
        {filters.map((item) => <button className={filter === item ? "filter-chip selected" : "filter-chip"} onClick={() => setFilter(item)} key={item}>{item}</button>)}
      </div>
      {results.length ? <div className="directory-grid">
        {results.map((destination, index) => <Link className="directory-card" href={`/destinations/${destination.id}`} key={destination.id}>
          <div className="directory-image">
            <Image src={getDestinationImage(destination.id)} alt={destination.name} fill sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw" />
            <span className="directory-card-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="directory-card-arrow"><ArrowUpRight size={16} /></span>
          </div>
          <div className="directory-card-info">
            <span>{destination.district.toUpperCase()} <i /> {destination.altitude_m.toLocaleString()} M</span>
            <h2>{destination.name}</h2>
            <p>{destination.overview}</p>
            <div><small>{destination.best_season}</small><strong>PKR {formatPKR(destination.cost_per_day_pkr)} <small>/ day</small></strong></div>
          </div>
        </Link>)}
      </div> : <div className="empty-state"><h2>No places found.</h2><p>Try another valley or district.</p></div>}
    </>
  );
}