import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Create account | Rahnuma GB",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <><SiteHeader /><main className="auth-page"><section className="auth-photo"><Image src="/static/images/attabad.webp" alt="Turquoise water at Attabad Lake" fill priority sizes="50vw" /><div className="auth-photo-scrim" /><Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to Rahnuma</Link><div className="auth-photo-caption"><span>36° 22′ N / 74° 52′ E</span><p>Take the long way<br /><em>to somewhere new.</em></p></div></section><section className="auth-panel"><div className="auth-panel-inner"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS NORTH</div><h1>Make room<br /><em>for wonder.</em></h1><p className="auth-subtitle">Keep your plans, places and conversations together.</p><AuthForm mode="register" /><p className="auth-switch">Already have an account? <Link href="/login">Sign in <span>↗</span></Link></p></div></section></main></>;
}