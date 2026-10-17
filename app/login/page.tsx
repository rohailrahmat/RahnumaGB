import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Sign in | Rahnuma GB",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string | string[] }> }) {
  const { registered } = await searchParams;
  return <><SiteHeader /><main className="auth-page"><section className="auth-photo"><Image src="/static/images/skardu.webp" alt="Late evening light on the Karakoram mountains" fill priority sizes="50vw" /><div className="auth-photo-scrim" /><Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to Rahnuma</Link><div className="auth-photo-caption"><span>35° 17′ N / 75° 38′ E</span><p>Some journeys<br /><em>stay with you.</em></p></div></section><section className="auth-panel"><div className="auth-panel-inner"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR NORTH, KEPT CLOSE</div><h1>Welcome<br /><em>back.</em></h1><p className="auth-subtitle">Your journeys are right where you left them.</p><AuthForm mode="login" registrationComplete={registered === "1"} /><p className="auth-switch">New to Rahnuma? <Link href="/register">Create an account <span>↗</span></Link></p></div></section></main></>;
}