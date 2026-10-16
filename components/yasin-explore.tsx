import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Compass, Footprints, Landmark, MapPin, Mountain, Waves } from "lucide-react";
import highlights from "@/data/yasin-highlights.json";

const placeIcons = [Mountain, Footprints, Landmark, MapPin, Waves];

export function YasinExplore() {
  return (
    <section className="yasin-explore" id="yasin-places">
      <div className="page-width">
        <div className="yasin-explore-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> FOLLOW THE VALLEY FURTHER</div>
            <h2>Little-known places.<br /><em>Big mountain feeling.</em></h2>
            <p>From quiet side valleys to a high Hindu Kush crossing, find a next stop that suits your pace. Access details are drawn from the regional tourism listings; always confirm current conditions with people on the ground.</p>
          </div>
          <figure className="yasin-explore-photo">
            <Image src="/static/images/yasin.webp" alt="A broad view across Yasin Valley and its mountain landscape" fill sizes="(max-width: 700px) 100vw, 40vw" />
            <figcaption><span>YASIN VALLEY</span><strong>Take the quieter road.</strong></figcaption>
          </figure>
        </div>

        <div className="yasin-place-grid">
          {highlights.map((place, index) => {
            const Icon = placeIcons[index] ?? Compass;
            return (
              <article className="yasin-place-card" key={place.id}>
                <div className="yasin-place-card-top">
                  <span className="yasin-place-icon"><Icon size={19} strokeWidth={1.7} /></span>
                  <span className="yasin-place-number">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <span className="yasin-place-category">{place.category}</span>
                <h3>{place.name}</h3>
                <p className="yasin-place-description">{place.description}</p>
                <div className="yasin-place-facts">
                  {place.elevation_m && <span><Mountain size={13} /> {place.elevation_m.toLocaleString()} m</span>}
                  <span><Compass size={13} /> {place.difficulty}</span>
                </div>
                <div className="yasin-place-season"><strong>WHEN TO GO</strong><span>{place.season}</span></div>
                <p className="yasin-place-access"><strong>Before you go</strong>{place.access} {place.facilities}</p>
                <div className="yasin-place-activities">
                  {place.activities.map((activity) => <span key={activity}>{activity}</span>)}
                </div>
                <a className="yasin-place-source" href={place.source_url} target="_blank" rel="noreferrer">
                  Source: {place.source} <ArrowUpRight size={14} />
                </a>
              </article>
            );
          })}
        </div>

        <div className="yasin-culture-note">
          <span className="yasin-culture-note-mark"><MapPin size={17} /></span>
          <p><strong>Travel with care.</strong> Ask before photographing people or entering private land, follow local guidance, and arrange a qualified guide for remote routes. Road, weather and facility information can change.</p>
          <Link href="/planner?interest=Yasin%20Valley">Plan a thoughtful visit <ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </section>
  );
}
