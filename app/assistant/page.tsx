import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import { AssistantWorkspace } from "@/components/assistant-workspace";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ask Rahnuma | Rahnuma GB",
  description: "Get practical local travel guidance for routes, destinations and journeys across Gilgit-Baltistan.",
};

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) return <><SiteHeader /><main className="assistant-gate"><div className="assistant-gate-mark"><Compass size={24} /></div><span className="eyebrow"><span className="eyebrow-dot" /> RAHNUMA TRAVEL DESK</span><h1>A local perspective<br /><em>starts here.</em></h1><p>Sign in to ask about routes, places and the details in between.</p><div><Link className="button button-dark" href="/login">Sign in <ArrowUpRight size={15} /></Link><Link className="gate-create" href="/register">Create account</Link></div></main></>;
  return <main className="assistant-page"><AssistantWorkspace userName={String(user.name)} /></main>;
}