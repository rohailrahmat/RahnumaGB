import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PlannerForm } from "@/components/planner-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Trip planner | Rehnuma GB" };

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ interest?: string }> }) {
  const [{ interest = "" }, user] = await Promise.all([searchParams, getCurrentUser()]);
  return <><SiteHeader /><main className="planner-page"><section className="planner-heading page-width"><div className="eyebrow"><Sparkles size={13} /> A ROUTE THAT FEELS LIKE YOURS</div><h1>Plan less.<br /><em>Be there more.</em></h1><p>Good journeys have room to change.</p></section><div className="page-width"><PlannerForm initialInterest={interest} />{!user && <div className="planner-login-note">Your route is ready when you are. <Link href="/login">Sign in to save it <ArrowRight size={14} /></Link></div>}</div></main></>;
}