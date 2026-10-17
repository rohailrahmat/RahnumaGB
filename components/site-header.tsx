"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountMenu } from "@/components/account-menu";

const links = [
  { href: "/destinations", label: "Places" },
  { href: "/guides", label: "Local guides" },
  { href: "/planner", label: "Trip planner" },
  { href: "/travel-desk", label: "Travel desk" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand-lockup" href="/" aria-label="Rahnuma GB home" onClick={() => setMenuOpen(false)}>
          <Image className="brand-mark" src="/static/rehnuma-mark.webp?v=2" alt="" width={40} height={40} priority unoptimized />
          <span className="brand-copy"><strong>RAHNUMA</strong><small>GILGIT–BALTISTAN</small></span>
        </Link>
        <nav id="main-navigation" className={`main-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {links.map((link) => (
            <Link
              className={pathname === link.href ? "active" : ""}
              aria-current={pathname === link.href ? "page" : undefined}
              href={link.href}
              key={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <AccountMenu />
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}