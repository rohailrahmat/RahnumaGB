import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { AssistantWorkspace } from "@/components/assistant-workspace";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ask Rahnuma | Rahnuma GB",
  description: "Get practical local travel guidance for routes, destinations and journeys across Gilgit-Baltistan.",
};

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="auth-page assistant-gate-page">
          <section className="auth-photo">
            <Image
              src="/static/images/hero.webp"
              alt="Mountain peaks rising above a valley in Gilgit-Baltistan"
              fill
              priority
              sizes="50vw"
            />
            <div className="auth-photo-scrim" />
            <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to Rahnuma</Link>
            <div className="auth-photo-caption">
              <span>GILGIT–BALTISTAN · PAKISTAN</span>
              <p>Find your way<br /><em>into the mountains.</em></p>
            </div>
          </section>
          <section className="auth-panel">
            <div className="auth-panel-inner">
              <div className="eyebrow"><span className="eyebrow-dot" /> RAHNUMA TRAVEL DESK</div>
              <h1>A local<br /><em>perspective.</em></h1>
              <p className="auth-subtitle">Sign in to ask about routes, places and the details in between.</p>
              <div className="assistant-gate-actions">
                <Link className="button button-dark" href="/login">Sign in <ArrowUpRight size={15} /></Link>
                <Link className="gate-create" href="/register">Create account</Link>
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }
  return <main className="assistant-page"><AssistantWorkspace userName={String(user.name)} /></main>;
}