"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUpRight, Compass, LoaderCircle, MessageSquarePlus, Send, Settings, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThemeToggle } from "@/components/theme-toggle";
import { destinations, getDestinationImage } from "@/lib/data";
import type { ChatMessage } from "@/lib/types";

type Session = { id: string; title: string; updated_at: string };

const prompts = ["When is the best time for Hunza?", "How do I reach Fairy Meadows?", "A quiet 4-day route from Skardu"];
const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));

export function AssistantWorkspace({ userName }: { userName: string }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sessions").then((response) => {
      if (!response.ok) throw new Error("Conversations request failed.");
      return response.json();
    }).then((data: Session[]) => {
      if (cancelled) return;
      setSessions(data);
      if (data[0]) setActiveId(data[0].id);
    }).catch(() => {
      if (!cancelled) setError("Your conversations couldn’t be loaded.");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    const controller = new AbortController();
    setMessages([]);
    fetch(`/api/sessions/${activeId}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject(new Error("Conversation request failed."))).then((data) => {
      setMessages(data.messages as ChatMessage[]);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name === "AbortError") return;
      setError("This conversation couldn’t be opened.");
    });
    return () => controller.abort();
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>, value = question) {
    event?.preventDefault();
    const prompt = value.trim();
    if (!prompt || busy) return;
    const messageId = crypto.randomUUID();
    setQuestion("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: prompt, id: messageId }]);
    setBusy(true);
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: prompt, ...(activeId ? { session_id: activeId } : {}) }) }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    if (!response?.ok) {
      setMessages((current) => current.filter((message) => message.id !== messageId));
      setError(result?.error || "Rahnuma couldn’t answer just now.");
    }
    else {
      setMessages((current) => [...current, { role: "assistant", content: result.text, sources: result.sources, id: crypto.randomUUID() }]);
      if (!activeId && result.session_id) setActiveId(result.session_id);
    }
    setBusy(false);
    fetch("/api/sessions").then((item) => item.ok ? item.json() : []).then(setSessions).catch(() => undefined);
  }

  async function selectSession(id: string) {
    setMessages([]);
    setActiveId(id);
  }

  async function newConversation() {
    setMessages([]);
    setActiveId("");
    setQuestion("");
    setError("");
  }

  async function removeSession(id: string) {
    const response = await fetch(`/api/sessions/${id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setError("This conversation couldn’t be deleted. Please try again.");
      return;
    }
    const nextSessions = sessions.filter((session) => session.id !== id);
    setSessions(nextSessions);
    if (activeId === id) {
      setActiveId(nextSessions[0]?.id ?? "");
      setMessages([]);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("rehnuma-auth-change"));
    router.push("/");
    router.refresh();
  }

  return <div className="assistant-shell">
    <aside className="assistant-sidebar">
      <Link className="assistant-brand" href="/"><Image className="brand-mark" src="/static/rehnuma-mark.webp?v=2" alt="" width={32} height={32} unoptimized /><span className="brand-copy"><strong>RAHNUMA</strong><small>YOUR FIELD GUIDE</small></span></Link>
      <button className="new-chat-button" disabled={busy} onClick={newConversation}><MessageSquarePlus size={16} /> New conversation <span>+</span></button>
      <div className="session-list-label">RECENT CONVERSATIONS</div>
      <div className="session-list">{sessions.map((session) => <div className={`session-item${activeId === session.id ? " active" : ""}`} key={session.id}><button disabled={busy} onClick={() => selectSession(session.id)}>{session.title}</button><button className="session-delete" disabled={busy} aria-label={`Delete ${session.title}`} onClick={() => removeSession(session.id)}><Trash2 size={14} /></button></div>)}</div>
      <div className="assistant-sidebar-bottom"><Link href="/destinations">Explore places <ArrowUpRight size={14} /></Link><button onClick={signOut}>{userName} <span>Sign out</span></button></div>
    </aside>
    <section className="assistant-main">
      <div className="assistant-topbar">
        <span>RAHNUMA <i /> TRAVEL DESK</span>
        <div className="assistant-topbar-actions" role="group" aria-label="Assistant tools">
          <ThemeToggle className="workspace-theme-toggle" />
          <Link href="/account" aria-label="Account settings" title="Settings"><Settings size={14} /><span>Settings</span></Link>
          <Link href="/planner" aria-label="Open trip planner" title="Open trip planner"><span>Open trip planner</span><ArrowUpRight size={14} /></Link>
        </div>
      </div>
      <div className="chat-scroll">
        {!messages.length && <div className="chat-welcome"><div className="chat-welcome-mark"><Compass size={23} /></div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR LOCAL FIELD GUIDE</span><h1>Where will<br /><em>the road take you?</em></h1><p>Ask about a valley, a route or the small details that make a trip work.</p><div className="prompt-list">{prompts.map((prompt) => <button key={prompt} onClick={() => sendMessage(undefined, prompt)}>{prompt}<ArrowUpRight size={14} /></button>)}</div></div>}
        <div className="chat-messages">
          {messages.map((message, index) => {
            const sourcedDestinations = message.role === "assistant"
              ? [...new Set(message.sources?.map((source) => source.dest) ?? [])]
                .map((id) => destinationById.get(id))
                .filter((destination) => destination !== undefined)
                .slice(0, 3)
              : [];

            return (
              <article className={`chat-message ${message.role}`} key={message.id ?? index}>
                <span className="message-avatar">{message.role === "assistant" ? <Compass size={15} /> : userName.charAt(0).toUpperCase()}</span>
                <div className="message-body">
                  <span className="message-name">{message.role === "assistant" ? "RAHNUMA" : userName.toUpperCase()}</span>
                  <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>
                  {sourcedDestinations.length > 0 && (
                    <div className="chat-destination-images" aria-label="Related destinations">
                      {sourcedDestinations.map((destination) => (
                        <Link className="chat-destination-card" key={destination.id} href={`/destinations/${destination.id}`}>
                          <span className="chat-destination-image">
                            <Image src={getDestinationImage(destination.id)} alt="" fill sizes="(max-width: 700px) 40vw, 180px" />
                          </span>
                          <span className="chat-destination-name">{destination.name}<ArrowUpRight size={12} /></span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.sources?.length ? <div className="source-links">{message.sources.slice(0, 3).map((source) => source.url
                    ? <a key={`${source.url}-${source.section}`} href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowUpRight size={12} /></a>
                    : <Link key={`${source.dest}-${source.section}`} href={`/destinations/${source.dest}`}>{source.label} <ArrowUpRight size={12} /></Link>)}</div> : null}
                </div>
              </article>
            );
          })}
          {busy && <article className="chat-message assistant"><span className="message-avatar"><Compass size={15} /></span><div className="message-body"><span className="message-name">RAHNUMA</span><div className="typing-indicator"><i /><i /><i /></div></div></article>}
          <div ref={endRef} />
        </div>
      </div>
      {error && <p className="chat-error" role="alert">{error}{error.includes("Sign in") && <> <Link href="/login">Sign in</Link></>}</p>}
      <div className="chat-composer-wrap"><form className="chat-composer" onSubmit={(event) => sendMessage(event)}><label className="sr-only" htmlFor="chat-question">Ask Rahnuma</label><textarea id="chat-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(undefined); } }} placeholder="Ask about the road north…" rows={1} /><button type="submit" disabled={busy || !question.trim()} aria-label="Send question">{busy ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}</button></form><p>GROUNDED IN LOCAL KNOWLEDGE · ALWAYS CHECK CONDITIONS BEFORE YOU TRAVEL</p></div>
    </section>
  </div>;
}