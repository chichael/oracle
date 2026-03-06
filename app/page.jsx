"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={path} />
  </svg>
);

const ICONS = {
  plus: "M12 5v14M5 12h14",
  send: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
  trash: "M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2",
  brain: "M9.5 2a2.5 2.5 0 000 5h1v2H9a5 5 0 00-5 5v1H2v2h2v1a3 3 0 003 3h10a3 3 0 003-3v-1h2v-2h-2v-1a5 5 0 00-5-5h-1.5V7h1a2.5 2.5 0 000-5H9.5z",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2.5 2.5 0 012.5-2.5H20v15",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  x: "M18 6L6 18M6 6l12 12",
  menu: "M3 12h18M3 6h18M3 18h18",
  chevron: "M9 18l6-6-6-6",
  circle: "M12 2a10 10 0 100 20 10 10 0 000-20z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const diff = today - d;
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const MEMORY_COLORS = {
  belief: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  preference: "text-blue-400 border-blue-400/30 bg-blue-400/5",
  knowledge_gap: "text-red-400 border-red-400/30 bg-red-400/5",
  framework: "text-green-400 border-green-400/30 bg-green-400/5",
  question: "text-purple-400 border-purple-400/30 bg-purple-400/5",
  context: "text-slate-400 border-slate-400/30 bg-slate-400/5",
};

// ─── Components ───────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-amber-400 font-mono text-xs">O</span>
      </div>
      <div className="bg-[#161920] border border-[#1E2229] rounded-lg px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-3 animate-slide-up ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-xs ${
        isUser
          ? "bg-[#1E2229] border border-[#2A2F3A] text-[#8A909E]"
          : "bg-amber-400/10 border border-amber-400/30 text-amber-400"
      }`}>
        {isUser ? "C" : "O"}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
        isUser
          ? "bg-[#1E2229] border border-[#2A2F3A] text-[#E8EAF0]"
          : "bg-[#161920] border border-[#1E2229] text-[#C8CAD0]"
      }`}>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose-investing text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}
        {msg.created_at && (
          <p className="text-[10px] text-[#4A5060] mt-2 font-mono">{formatTime(msg.created_at)}</p>
        )}
      </div>
    </div>
  );
}

function IngestModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111318] border border-[#1E2229] rounded-xl w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E2229]">
          <div className="flex items-center gap-2">
            <Icon path={ICONS.upload} size={15} className="text-amber-400" />
            <span className="text-sm font-medium text-[#E8EAF0]">Ingest Knowledge</span>
          </div>
          <button onClick={onClose} className="text-[#4A5060] hover:text-[#8A909E] transition-colors">
            <Icon path={ICONS.x} size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-mono text-[#4A5060] uppercase tracking-wider block mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Notes on Buffett's 1987 Shareholder Letter"
              className="w-full bg-[#0A0C10] border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm text-[#E8EAF0] placeholder-[#4A5060] focus:border-amber-400/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#4A5060] uppercase tracking-wider block mb-1.5">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-[#0A0C10] border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm text-[#E8EAF0] focus:border-amber-400/50 focus:outline-none transition-colors"
            >
              <option value="manual">Manual Entry</option>
              <option value="obsidian">Obsidian / Nimbus</option>
              <option value="book">Book / Paper</option>
              <option value="memo">Investment Memo</option>
              <option value="thesis">Thesis</option>
              <option value="article">Article</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-[#4A5060] uppercase tracking-wider block mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your notes, thoughts, or content here..."
              rows={8}
              className="w-full bg-[#0A0C10] border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm text-[#E8EAF0] placeholder-[#4A5060] focus:border-amber-400/50 focus:outline-none transition-colors font-mono text-xs leading-relaxed"
            />
          </div>

          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[#1E2229]">
          <span className="text-xs font-mono text-[#4A5060]">{content.length} chars</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#8A909E] hover:text-[#E8EAF0] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="px-4 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Ingesting..." : "Ingest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("memory");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [memories, setMemories] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [showIngest, setShowIngest] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    loadMemories();
    loadKnowledge();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) loadMessages(activeConversationId);
    else setMessages([]);
  }, [activeConversationId]);

  const loadConversations = async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(data || []);
  };

  const loadMessages = async (id) => {
    setLoading(true);
    const res = await fetch(`/api/messages?conversationId=${id}`);
    const data = await res.json();
    setMessages(data || []);
    setLoading(false);
  };

  const loadMemories = async () => {
    const res = await fetch("/api/memories");
    const data = await res.json();
    setMemories(data || []);
  };

  const loadKnowledge = async () => {
    const res = await fetch("/api/ingest");
    const data = await res.json();
    setKnowledge(data || []);
  };

  const createConversation = async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Conversation" }),
    });
    const data = await res.json();
    setConversations((prev) => [data, ...prev]);
    setActiveConversationId(data.id);
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    await fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const deleteMemory = async (id) => {
    await fetch("/api/memories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const deleteKnowledge = async (id) => {
    await fetch("/api/ingest", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setKnowledge((prev) => prev.filter((k) => k.id !== id));
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    let convId = activeConversationId;

    // Auto-create conversation if none active
    if (!convId) {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.substring(0, 60) }),
      });
      const data = await res.json();
      convId = data.id;
      setActiveConversationId(convId);
      setConversations((prev) => [data, ...prev]);
    }

    const userMessage = { role: "user", content: input.trim(), created_at: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setStreamingContent("");
    setStreaming(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, conversationId: convId }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: accumulated, created_at: new Date().toISOString() },
              ]);
              setStreamingContent("");
              // Refresh memories after response
              setTimeout(loadMemories, 2000);
              setTimeout(() => loadConversations(), 500);
              break;
            }
            try {
              const parsed = JSON.parse(data);
              accumulated += parsed.text;
              setStreamingContent(accumulated);
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const groupedMemories = memories.reduce((acc, m) => {
    if (!acc[m.type]) acc[m.type] = [];
    acc[m.type].push(m);
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0C10] grid-bg relative">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Left Sidebar ──────────────────────────────────────────── */}
      <aside className={`
        fixed lg:relative z-30 lg:z-auto h-full
        w-72 flex-shrink-0 flex flex-col
        bg-[#0D0F14] border-r border-[#1E2229]
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-[#1E2229]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center amber-glow">
              <span className="text-amber-400 font-mono text-sm font-bold">O</span>
            </div>
            <div>
              <h1 className="text-[#E8EAF0] font-display text-base tracking-wide">ORACLE</h1>
              <p className="text-[#4A5060] font-mono text-[10px] uppercase tracking-wider">Investment Intelligence</p>
            </div>
          </div>
        </div>

        {/* Agent Info */}
        <div className="p-4 border-b border-[#1E2229]">
          <div className="bg-amber-400/5 border border-amber-400/15 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-amber" />
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Active Agent</span>
            </div>
            <p className="text-sm text-[#E8EAF0] font-medium">Investing</p>
            <p className="text-xs text-[#4A5060] mt-1">{memories.length} memories · {knowledge.length} docs</p>
          </div>
        </div>

        {/* New Conversation */}
        <div className="p-3 border-b border-[#1E2229]">
          <button
            onClick={createConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-400/8 hover:bg-amber-400/15 border border-amber-400/20 hover:border-amber-400/40 text-amber-400 text-sm font-medium transition-all"
          >
            <Icon path={ICONS.plus} size={14} />
            New Conversation
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 && (
            <p className="text-[#4A5060] text-xs font-mono text-center py-8">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setActiveConversationId(conv.id); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group flex items-start justify-between gap-2 ${
                activeConversationId === conv.id
                  ? "bg-amber-400/10 border border-amber-400/20 text-[#E8EAF0]"
                  : "hover:bg-[#161920] border border-transparent text-[#8A909E] hover:text-[#E8EAF0]"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate font-medium">{conv.title || "Untitled"}</p>
                {conv.last_message && (
                  <p className="text-xs text-[#4A5060] truncate mt-0.5 font-mono">{conv.last_message}</p>
                )}
                <p className="text-[10px] text-[#4A5060] mt-1 font-mono">{formatDate(conv.updated_at || conv.created_at)}</p>
              </div>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 text-[#4A5060] hover:text-red-400 transition-all p-0.5 flex-shrink-0 mt-0.5"
              >
                <Icon path={ICONS.trash} size={12} />
              </button>
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#1E2229] space-y-1">
          <button
            onClick={() => { setShowIngest(true); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#161920] text-[#8A909E] hover:text-[#E8EAF0] text-sm transition-all"
          >
            <Icon path={ICONS.upload} size={14} />
            Ingest Notes
          </button>
          <button
            onClick={() => { setRightPanelTab("memory"); setRightPanelOpen(true); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#161920] text-[#8A909E] hover:text-[#E8EAF0] text-sm transition-all lg:hidden"
          >
            <Icon path={ICONS.brain} size={14} />
            View Memory ({memories.length})
          </button>
        </div>
      </aside>

      {/* ── Main Chat Area ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#1E2229] bg-[#0D0F14]/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#4A5060] hover:text-[#E8EAF0] transition-colors"
          >
            <Icon path={ICONS.menu} size={18} />
          </button>

          <div className="flex-1 min-w-0">
            {activeConversationId ? (
              <p className="text-sm text-[#E8EAF0] font-medium truncate">
                {conversations.find((c) => c.id === activeConversationId)?.title || "Conversation"}
              </p>
            ) : (
              <p className="text-sm text-[#4A5060] font-mono">Select or start a conversation</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/5 border border-amber-400/15 rounded-full">
              <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse-amber" />
              <span className="text-amber-400 font-mono text-[10px] uppercase">Online</span>
            </div>
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="hidden lg:flex items-center gap-1.5 text-[#4A5060] hover:text-[#E8EAF0] transition-colors text-xs font-mono"
            >
              <Icon path={ICONS.brain} size={14} />
              Memory
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {!activeConversationId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-4 amber-glow">
                <span className="text-amber-400 font-display text-2xl italic">O</span>
              </div>
              <h2 className="text-xl font-display text-[#E8EAF0] mb-2">ORACLE</h2>
              <p className="text-[#8A909E] text-sm max-w-xs leading-relaxed">
                Your personal investment intelligence. Ask anything about markets, valuation, portfolio strategy, or your own investment thinking.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {[
                  "What's the current macro environment telling us about duration risk?",
                  "Help me build a framework for evaluating early-stage VC deals",
                  "Walk me through how to think about QSBS optimization",
                  "What are the key drivers of private credit spreads right now?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                    className="text-left p-3 bg-[#111318] hover:bg-[#161920] border border-[#1E2229] hover:border-[#2A2F3A] rounded-lg text-xs text-[#8A909E] hover:text-[#E8EAF0] transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          )}

          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}

          {streaming && streamingContent && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-400 font-mono text-xs">O</span>
              </div>
              <div className="max-w-[80%] bg-[#161920] border border-[#1E2229] rounded-lg px-4 py-3">
                <div className="prose-investing text-sm leading-relaxed text-[#C8CAD0]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                </div>
                <span className="inline-block w-1.5 h-3.5 bg-amber-400 animate-blink ml-0.5" />
              </div>
            </div>
          )}

          {streaming && !streamingContent && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 pb-4 pt-2 border-t border-[#1E2229] bg-[#0D0F14]/80 backdrop-blur-sm">
          <div className="relative bg-[#111318] border border-[#1E2229] focus-within:border-amber-400/40 rounded-xl transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask ORACLE anything about investing..."
              rows={1}
              className="w-full bg-transparent px-4 py-3.5 pr-14 text-sm text-[#E8EAF0] placeholder-[#4A5060] rounded-xl"
              style={{ minHeight: "52px", maxHeight: "160px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 border border-amber-400/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon path={ICONS.send} size={13} />
            </button>
          </div>
          <p className="text-[10px] text-[#4A5060] font-mono mt-2 text-center">
            ↵ send · shift+↵ newline · memories auto-extracted after each conversation
          </p>
        </div>
      </main>

      {/* ── Right Panel (Memory + Knowledge) ─────────────────────── */}
      {(rightPanelOpen) && (
        <aside className={`
          fixed lg:relative right-0 top-0 z-30 lg:z-auto
          h-full w-80 flex-shrink-0 flex flex-col
          bg-[#0D0F14] border-l border-[#1E2229]
          animate-fade-in
        `}>
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1E2229]">
            <div className="flex gap-1">
              {["memory", "knowledge"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightPanelTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                    rightPanelTab === tab
                      ? "bg-amber-400/10 text-amber-400 border border-amber-400/25"
                      : "text-[#4A5060] hover:text-[#8A909E]"
                  }`}
                >
                  {tab}
                  <span className="ml-1.5 opacity-60">
                    {tab === "memory" ? memories.length : knowledge.length}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setRightPanelOpen(false)}
              className="text-[#4A5060] hover:text-[#8A909E] transition-colors"
            >
              <Icon path={ICONS.x} size={14} />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {rightPanelTab === "memory" && (
              <>
                {memories.length === 0 && (
                  <div className="text-center py-12">
                    <Icon path={ICONS.brain} size={24} className="text-[#2A2F3A] mx-auto mb-3" />
                    <p className="text-xs text-[#4A5060] font-mono">No memories yet.<br/>Start chatting to build context.</p>
                  </div>
                )}
                {Object.entries(groupedMemories).map(([type, items]) => (
                  <div key={type}>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#4A5060] mb-1.5 px-1">{type}s</p>
                    {items.map((mem) => (
                      <div key={mem.id} className={`flex items-start gap-2 p-2.5 rounded-lg border mb-1.5 group ${MEMORY_COLORS[mem.type] || MEMORY_COLORS.context}`}>
                        <p className="text-xs flex-1 leading-relaxed">{mem.content}</p>
                        <button
                          onClick={() => deleteMemory(mem.id)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
                        >
                          <Icon path={ICONS.x} size={10} className="text-current opacity-50 hover:opacity-100" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}

            {rightPanelTab === "knowledge" && (
              <>
                <button
                  onClick={() => setShowIngest(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-400/8 hover:bg-amber-400/15 border border-amber-400/20 hover:border-amber-400/40 text-amber-400 text-xs font-mono transition-all mb-2"
                >
                  <Icon path={ICONS.plus} size={12} />
                  Ingest New Document
                </button>

                {knowledge.length === 0 && (
                  <div className="text-center py-8">
                    <Icon path={ICONS.book} size={24} className="text-[#2A2F3A] mx-auto mb-3" />
                    <p className="text-xs text-[#4A5060] font-mono">No documents ingested.<br/>Add notes, memos, or research.</p>
                  </div>
                )}

                {knowledge.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-[#1E2229] bg-[#111318] group hover:border-[#2A2F3A] transition-all">
                    <Icon path={ICONS.book} size={12} className="text-[#4A5060] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#E8EAF0] truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-[#4A5060] bg-[#1E2229] px-1.5 py-0.5 rounded">{doc.source}</span>
                        <span className="text-[10px] font-mono text-[#4A5060]">{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteKnowledge(doc.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-[#4A5060] hover:text-red-400 transition-all"
                    >
                      <Icon path={ICONS.trash} size={11} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>
      )}

      {/* Right panel toggle (desktop, when closed) */}
      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 flex-col items-center gap-1 px-1.5 py-4 bg-[#111318] border border-r-0 border-[#1E2229] rounded-l-lg text-[#4A5060] hover:text-amber-400 hover:border-amber-400/20 transition-all z-10"
        >
          <Icon path={ICONS.brain} size={13} />
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ writingMode: "vertical-rl" }}>Memory</span>
        </button>
      )}

      {/* Ingest Modal */}
      {showIngest && (
        <IngestModal
          onClose={() => setShowIngest(false)}
          onSuccess={() => {
            setShowIngest(false);
            loadKnowledge();
          }}
        />
      )}
    </div>
  );
}
