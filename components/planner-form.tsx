"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, ExternalLink, LoaderCircle, MapPin, Wallet } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { destinations, getDestinationImage, tripOrigins } from "@/lib/data";
import { getOpenStreetMapDirectionsUrl, getOpenStreetMapEmbedUrl } from "@/lib/map";

type Itinerary = {
  days: Array<{ day: number; dest_id: string; title: string; plan: string; cost_pkr: number | null }>;
  safety_note: string;
  pins: Array<{ id: string; name: string; lat: number; lng: number }>;
  origin: { id: string; name: string; lat: number; lng: number };
};

export function PlannerForm({ initialInterest = "" }: { initialInterest?: string }) {
  const [days, setDays] = useState("5");
  const [budget, setBudget] = useState("120000");
  const [startLocation, setStartLocation] = useState<string>(tripOrigins[0].id);
  const [interests, setInterests] = useState(initialInterest);
  const [plan, setPlan] = useState<Itinerary | null>(null);
  const [selectedPinId, setSelectedPinId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setPlan(null);
    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number(days), budget: Number(budget), interests, startLocation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "We couldn’t shape that route just now.");
      setPlan(payload as Itinerary);
      setSelectedPinId(payload.pins?.[0]?.id ?? "");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn’t shape that route just now.");
    } finally {
      setBusy(false);
    }
  }

  const selectedPin = plan?.pins.find((pin) => pin.id === selectedPinId) ?? plan?.pins[0];
  const selectedDestination = selectedPin ? destinations.find((destination) => destination.id === selectedPin.id) : undefined;
  const routePoints = plan ? [plan.origin, ...plan.pins] : [];

  return <div className="planner-workspace">
    <form className="planner-form" onSubmit={submit}>
      <div className="planner-form-title"><span className="eyebrow"><span className="eyebrow-dot" /> YOUR JOURNEY, YOUR PACE</span><h2>Start with what<br /><em>matters to you.</em></h2></div>
      <label className="planner-field"><span><CalendarDays size={16} /> TIME AWAY</span><select value={days} onChange={(event) => setDays(event.target.value)}>{[2, 3, 4, 5, 7, 10, 14, 21].map((value) => <option value={value} key={value}>{value} days</option>)}</select></label>
      <label className="planner-field"><span><MapPin size={16} /> STARTING POINT</span><select value={startLocation} onChange={(event) => setStartLocation(event.target.value)}>{tripOrigins.map((origin) => <option value={origin.id} key={origin.id}>{origin.name}</option>)}</select></label>
      <label className="planner-field"><span><Wallet size={16} /> TOTAL BUDGET · PKR</span><input type="number" min="1000" step="5000" value={budget} onChange={(event) => setBudget(event.target.value)} required /></label>
      <label className="planner-field planner-interests"><span><MapPin size={16} /> WHAT DRAWS YOU NORTH?</span><textarea value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Lakes, quiet valleys, local food…" rows={3} required /></label>
      {error && <p className="form-error" role="alert">{error}{error.includes("Sign in") && <> <Link href="/login">Sign in</Link></>}</p>}
      <button className="button button-dark planner-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : "Shape my route"}<ArrowUpRight size={16} /></button>
      <small className="planner-form-note">Routes grounded in local destination data. Costs are estimates.</small>
    </form>
    <section className={`planner-result${plan ? " has-plan" : ""}`} aria-live="polite">
      {!plan && <div className="planner-empty"><div className="planner-empty-icon"><MapPin size={20} /></div><span className="eyebrow">A GOOD PLACE TO BEGIN</span><h2>Make the days<br /><em>your own.</em></h2><p>Your route will take shape here.</p><div className="planner-mini-line"><Check size={14} /> Thoughtful, not rushed</div></div>}
      {plan && <div className="plan-output">
        <div className="plan-output-top"><span className="eyebrow"><span className="eyebrow-dot" /> YOUR NORTHBOUND PLAN</span><strong>{plan.days.length} DAYS · STARTING IN {plan.origin.name.toUpperCase()}</strong></div>
        <h2>Room to <em>wander.</em></h2>
        <section className="plan-route">
          <div className="plan-route-heading"><div><span className="eyebrow"><MapPin size={12} /> YOUR ROUTE</span><h3>See where the road <em>leads.</em></h3></div><a href={getOpenStreetMapDirectionsUrl(routePoints)} target="_blank" rel="noreferrer">Open directions <ExternalLink size={13} /></a></div>
          <div className="plan-map-frame">
            <iframe key={selectedDestination?.id ?? plan.origin.id} src={getOpenStreetMapEmbedUrl(selectedDestination ?? plan.origin, 0.32)} title={`Map of your route near ${selectedDestination?.name ?? plan.origin.name}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
          </div>
          <div className="plan-route-stops"><span className="plan-origin-pill"><MapPin size={13} /> Start · {plan.origin.name}</span>{plan.pins.map((pin, index) => <button className={pin.id === selectedPin?.id ? "selected" : ""} type="button" onClick={() => setSelectedPinId(pin.id)} key={pin.id}><span>{String(index + 1).padStart(2, "0")}</span>{pin.name}</button>)}</div>
          <p className="map-attribution">Map pins are approximate valley locations, not road geometry. Use the directions link for a route overview and confirm current road conditions locally.</p>
        </section>
        <div className="plan-days">{plan.days.map((day) => <article className="plan-day" key={`${day.day}-${day.dest_id}`}><div className="plan-day-image"><img src={getDestinationImage(day.dest_id)} alt="" /></div><div className="plan-day-copy"><span>DAY {String(day.day).padStart(2, "0")} · {day.cost_pkr !== null ? `PKR ${day.cost_pkr.toLocaleString()}` : "COST NOT ESTIMATED"}</span><h3>{day.title}</h3><div className="plan-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{day.plan}</ReactMarkdown></div></div></article>)}</div>
        {plan.safety_note && <div className="plan-safety"><Check size={15} /><div><strong>Before you go</strong><p>{plan.safety_note}</p></div></div>}
      </div>}
    </section>
  </div>;
}