"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/destinations", label: "Places" },
  { href: "/guides", label: "Local guides" },
  { href: "/planner", label: "Trip planner" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand-lockup" href="/" aria-label="Rehnuma GB home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><Compass size={19} strokeWidth={1.8} /></span>
          <span className="brand-copy"><strong>rehnuma</strong><small>GILGIT–BALTISTAN</small></span>
        </Link>
        <nav className={`main-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {links.map((link) => (
            <Link
              className={pathname === link.href ? "active" : ""}
              href={link.href}
              key={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link className="nav-mobile-assistant" href="/assistant" onClick={() => setMenuOpen(false)}>Ask Rehnuma <span>↗</span></Link>
        </nav>
        <div className="header-actions">
          <Link className="header-signin" href="/login">Sign in</Link>
          <Link className="button button-dark header-cta" href="/assistant">Ask Rehnuma <span>↗</span></Link>
        </div>
        <button className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}