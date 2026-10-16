"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AccountUser = { name: string; email: string };

export function AccountMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [accountStatus, setAccountStatus] = useState<"loading" | "ready" | "error">("loading");
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        if (!response.ok) throw new Error("Your sign-in status could not be checked.");
        const payload = await response.json();
        if (active) {
          setUser(payload.user ?? null);
          setAccountStatus("ready");
        }
      } catch {
        if (active) {
          setUser(null);
          setAccountStatus("error");
        }
      }
    };
    const onAuthChange = () => {
      setAccountStatus("loading");
      setRefreshKey((value) => value + 1);
    };
    void loadUser();
    window.addEventListener("rehnuma-auth-change", onAuthChange);
    return () => {
      active = false;
      window.removeEventListener("rehnuma-auth-change", onAuthChange);
    };
  }, [pathname, refreshKey]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function signOut() {
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("You couldn’t be signed out. Please try again.");
      setUser(null);
      setAccountStatus("ready");
      setOpen(false);
      window.dispatchEvent(new Event("rehnuma-auth-change"));
      router.push("/");
      router.refresh();
    } catch {
      setError("You couldn’t be signed out. Please try again.");
    }
  }

  if (accountStatus === "loading") return <span className="account-loading" aria-hidden="true" />;
  if (accountStatus === "error") return <button className="account-status-error" type="button" aria-label="Account status unavailable. Retry." title="Account status unavailable. Retry." onClick={() => setRefreshKey((value) => value + 1)}><AlertCircle size={17} /></button>;
  if (!user) return <Link className="header-signin" href="/login">Sign in</Link>;

  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className="account-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-avatar">{initials || <UserRound size={16} />}</span>
        <span className="account-trigger-name">{user.name}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="account-popover" role="menu">
          <div className="account-popover-user">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          {error && <p className="account-menu-error" role="alert">{error}</p>}
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)}><Settings size={15} /> Account settings</Link>
          <button type="button" role="menuitem" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </div>
      )}
    </div>
  );
}
