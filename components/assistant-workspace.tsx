"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUpRight, Compass, LoaderCircle, MessageSquarePlus, Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";

type Session = { id: string; title: string; updated_at: string };

const prompts = ["When is the best time for Hunza?", "How do I reach Fairy Meadows?", "A quiet 4-day route from Skardu"];

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
    fetch("/api/sessions").then((response) => response.ok ? response.json() : []).then((data: Session[]) => {
      setSessions(data);
      if (data[0]) setActiveId(data[0].id);
    }).catch(() => setError("Your conversations couldn’t be loaded."));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/sessions/${activeId}`).then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.messages) setMessages(data.messages as ChatMessage[]);
    }).catch(() => setError("This conversation couldn’t be opened."));
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>, value = question) {
    event?.preventDefault();
    const prompt = value.trim();
    if (!prompt || busy) return;
    setQuestion("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: prompt, id: crypto.randomUUID() }]);
    setBusy(true);
    let sessionId = activeId;
    if (!sessionId) {
      const created = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: prompt.slice(0, 50) }) }).catch(() => null);
      const session = await created?.json().catch(() => null);
      if (!created?.ok) {
        setError(session?.error || "Couldn’t start a conversation.");
        setBusy(false);
        return;
      }
      sessionId = session.id;
      setActiveId(sessionId);
      setSessions((current) => [session, ...current]);
    }
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: prompt, session_id: sessionId }) }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    if (!response?.ok) setError(result?.error || "Rehnuma couldn’t answer just now.");
    else setMessages((current) => [...current, { role: "assistant", content: result.text, sources: result.sources, id: crypto.randomUUID() }]);
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
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    const nextSessions = sessions.filter((session) => session.id !== id);
    setSessions(nextSessions);
    if (activeId === id) {
      setActiveId(nextSessions[0]?.id ?? "");
      setMessages([]);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return <div className="assistant-shell">
    <aside className="assistant-sidebar">
      <Link className="assistant-brand" href="/"><span className="brand-mark"><Compass size={18} /></span><span className="brand-copy"><strong>rehnuma</strong><small>YOUR FIELD GUIDE</small></span></Link>
      <button className="new-chat-button" onClick={newConversation}><MessageSquarePlus size={16} /> New conversation <span>+</span></button>
      <div className="session-list-label">RECENT CONVERSATIONS</div>
      <div className="session-list">{sessions.map((session) => <div className={`session-item${activeId === session.id ? " active" : ""}`} key={session.id}><button onClick={() => selectSession(session.id)}>{session.title}</button><button className="session-delete" aria-label={`Delete ${session.title}`} onClick={() => removeSession(session.id)}><Trash2 size={14} /></button></div>)}</div>
      <div className="assistant-sidebar-bottom"><Link href="/destinations">Explore places <ArrowUpRight size={14} /></Link><button onClick={signOut}>{userName} <span>Sign out</span></button></div>
    </aside>
    <section className="assistant-main">
      <div className="assistant-topbar"><span>REHNUMA <i /> TRAVEL DESK</span><Link href="/planner">Open trip planner <ArrowUpRight size={14} /></Link></div>
      <div className="chat-scroll">
        {!messages.length && <div className="chat-welcome"><div className="chat-welcome-mark"><Compass size={23} /></div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR LOCAL FIELD GUIDE</span><h1>Where will<br /><em>the road take you?</em></h1><p>Ask about a valley, a route or the small details that make a trip work.</p><div className="prompt-list">{prompts.map((prompt) => <button key={prompt} onClick={() => sendMessage(undefined, prompt)}>{prompt}<ArrowUpRight size={14} /></button>)}</div></div>}
        <div className="chat-messages">{messages.map((message, index) => <article className={`chat-message ${message.role}`} key={message.id ?? index}><span className="message-avatar">{message.role === "assistant" ? <Compass size={15} /> : userName.charAt(0).toUpperCase()}</span><div className="message-body"><span className="message-name">{message.role === "assistant" ? "REHNUMA" : userName.toUpperCase()}</span><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>{message.sources?.length ? <div className="source-links">{message.sources.slice(0, 3).map((source) => <Link key={`${source.dest}-${source.section}`} href={`/destinations/${source.dest}`}>{source.label} <ArrowUpRight size={12} /></Link>)}</div> : null}</div></article>)}{busy && <article className="chat-message assistant"><span className="message-avatar"><Compass size={15} /></span><div className="message-body"><span className="message-name">REHNUMA</span><div className="typing-indicator"><i /><i /><i /></div></div></article>}<div ref={endRef} /></div>
      </div>
      {error && <p className="chat-error" role="alert">{error}{error.includes("Sign in") && <> <Link href="/login">Sign in</Link></>}</p>}
      <div className="chat-composer-wrap"><form className="chat-composer" onSubmit={(event) => sendMessage(event)}><label className="sr-only" htmlFor="chat-question">Ask Rehnuma</label><textarea id="chat-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(undefined); } }} placeholder="Ask about the road north…" rows={1} /><button type="submit" disabled={busy || !question.trim()} aria-label="Send question">{busy ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}</button></form><p>GROUNDED IN LOCAL KNOWLEDGE · ALWAYS CHECK CONDITIONS BEFORE YOU TRAVEL</p></div>
    </section>
  </div>;
}