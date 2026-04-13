import { useState, useRef, useCallback } from "react";

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
// Paste your Cloudflare Worker URL below
const WORKER_URL = "https://dataforge-proxy.29neha93.workers.dev";

// ─── BRAND & DESIGN TOKENS ──────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500&family=Nunito:wght@900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #ffffff;
    --surface: #f7f6f3;
    --border:  #e8e6e1;
    --text:    #111110;
    --muted:   #999892;
    --accent:  #2e7d32;
    --dark:    #1a1a1a;
    --serif:   'Playfair Display', Georgia, serif;
    --sans:    'Inter', system-ui, sans-serif;
    --logo:    'Nunito', sans-serif;
    --radius:  10px;
    --shadow:  0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Animations ── */
  @keyframes needleRock {
    0%,100% { transform: rotate(-6deg); }
    50%      { transform: rotate(6deg); }
  }
  @keyframes needleSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes birdFloat {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { opacity: 0.5; }
    50%  { opacity: 1; }
    100% { opacity: 0.5; }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .compass-idle    { animation: needleRock 3s ease-in-out infinite; transform-origin: center; }
  .compass-loading { animation: needleSpin 1.2s linear infinite; transform-origin: center; }
  .bird-a { animation: birdFloat 3s ease-in-out infinite; }
  .bird-b { animation: birdFloat 3s ease-in-out 0.8s infinite; }
  .bird-c { animation: birdFloat 3s ease-in-out 1.6s infinite; }
  .fade-up { animation: fadeUp 0.4s ease both; }
  .shimmer { animation: shimmer 1.6s ease-in-out infinite; }

  /* ── Layout ── */
  .app    { max-width: 680px; margin: 0 auto; padding: 0 0 80px; }
  .header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .header-logo {
    display: flex; align-items: center; gap: 10px;
  }
  .logo-mark { flex-shrink: 0; }
  .logo-text {
    display: flex; flex-direction: column; gap: 0;
  }
  .logo-en {
    font-family: var(--logo);
    font-size: 15px; font-weight: 900;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--dark); line-height: 1;
  }
  .logo-hi {
    font-family: var(--serif);
    font-size: 11px; color: var(--accent);
    font-style: italic; letter-spacing: 0.04em; line-height: 1.4;
  }
  .header-date {
    font-size: 11px; color: var(--muted);
    font-family: var(--sans); font-weight: 300;
    letter-spacing: 0.06em;
  }

  /* ── Tabs ── */
  .tabs {
    display: flex; gap: 0;
    border-bottom: 1px solid var(--border);
    padding: 0 24px;
    background: var(--bg);
  }
  .tab-btn {
    font-family: var(--sans); font-size: 12px; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--muted); background: none; border: none; cursor: pointer;
    padding: 14px 0; margin-right: 24px;
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
  }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-btn:hover:not(.active) { color: var(--text); }

  /* ── Write Tab ── */
  .composer { padding: 28px 24px; }
  .loc-row  { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .loc-input {
    flex: 1; font-family: var(--serif); font-size: 20px; font-style: italic;
    color: var(--text); background: none; border: none; outline: none;
    border-bottom: 1px solid var(--border); padding-bottom: 6px;
    transition: border-color 0.2s;
  }
  .loc-input::placeholder { color: var(--muted); }
  .loc-input:focus { border-bottom-color: var(--accent); }
  .loc-date { font-size: 11px; color: var(--muted); white-space: nowrap; letter-spacing: 0.05em; }

  .prompt-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
  .chip {
    font-family: var(--sans); font-size: 11px; font-weight: 500;
    padding: 6px 14px; border-radius: 100px;
    border: 1px solid var(--border); background: var(--bg);
    color: var(--muted); cursor: pointer;
    display: flex; align-items: center; gap: 5px;
    transition: all 0.15s; white-space: nowrap;
  }
  .chip:hover { border-color: var(--accent); color: var(--accent); }
  .chip.active {
    background: var(--accent); border-color: var(--accent);
    color: #fff;
  }

  .active-prompt {
    background: var(--surface); border-radius: var(--radius);
    padding: 16px 18px; margin-bottom: 16px;
  }
  .prompt-q { font-family: var(--serif); font-size: 15px; font-style: italic; color: var(--text); line-height: 1.5; }
  .prompt-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }

  .entry-area {
    width: 100%; min-height: 120px; resize: vertical;
    font-family: var(--serif); font-size: 15px; line-height: 1.7;
    color: var(--text); background: none; border: none; outline: none;
    border-bottom: 1px solid var(--border); padding-bottom: 8px;
    transition: border-color 0.2s;
  }
  .entry-area::placeholder { color: var(--muted); font-style: italic; }
  .entry-area:focus { border-bottom-color: var(--accent); }

  .entry-actions {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 16px;
  }
  .voice-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--sans); font-size: 12px; font-weight: 500;
    color: var(--muted); background: none; border: 1px solid var(--border);
    border-radius: 100px; padding: 8px 16px; cursor: pointer;
    transition: all 0.2s;
  }
  .voice-btn:hover { border-color: var(--accent); color: var(--accent); }
  .voice-btn.recording {
    background: #fef2f2; border-color: #ef4444; color: #ef4444;
  }
  .voice-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: currentColor;
  }
  .voice-btn.recording .voice-dot { animation: shimmer 0.8s ease-in-out infinite; }

  .save-btn {
    font-family: var(--sans); font-size: 12px; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase;
    background: var(--accent); color: #fff;
    border: none; border-radius: var(--radius);
    padding: 10px 22px; cursor: pointer;
    transition: opacity 0.2s;
  }
  .save-btn:hover { opacity: 0.88; }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Emotion Tags ── */
  .emotion-row { margin-top: 18px; }
  .emotion-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .emotion-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .emo-chip {
    font-size: 11px; padding: 4px 11px; border-radius: 100px;
    border: 1px solid var(--border); background: var(--bg);
    color: var(--muted); cursor: pointer; transition: all 0.15s;
  }
  .emo-chip.active { background: var(--surface); border-color: var(--accent); color: var(--accent); }

  /* ── Journal Tab ── */
  .journal { padding: 24px; }

  /* Mountain/wave SVG divider */
  .divider { width: 100%; margin: 0 0 24px; display: block; }

  .entry-card {
    background: var(--surface); border-radius: var(--radius);
    padding: 18px 20px; margin-bottom: 14px;
    border: 1px solid var(--border);
    animation: fadeUp 0.35s ease both;
  }
  .entry-meta {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }
  .entry-loc { font-family: var(--serif); font-size: 15px; font-style: italic; color: var(--text); }
  .entry-date { font-size: 10px; color: var(--muted); letter-spacing: 0.06em; }
  .entry-prompt-tag {
    font-size: 10px; color: var(--accent); text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 8px;
  }
  .entry-text { font-family: var(--serif); font-size: 14px; line-height: 1.7; color: var(--text); }
  .entry-emotion { font-size: 11px; color: var(--muted); margin-top: 8px; }

  /* ── Memoir Tab ── */
  .memoir-section { padding: 28px 24px; }
  .memoir-birds {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 20px;
  }

  .memoir-cta {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px 20px;
    cursor: pointer; width: 100%;
    transition: border-color 0.2s;
  }
  .memoir-cta:hover { border-color: var(--accent); }
  .memoir-cta-left {}
  .memoir-title-text { font-family: var(--serif); font-size: 16px; color: var(--text); }
  .memoir-sub { font-size: 11px; color: var(--muted); margin-top: 3px; }
  .memoir-arrow { font-size: 18px; color: var(--muted); }

  .memoir-output {
    margin-top: 20px; padding: 24px 0;
    border-top: 1px solid var(--border);
    animation: fadeUp 0.4s ease both;
  }
  .memoir-text {
    font-family: var(--serif); font-size: 16px; line-height: 1.85;
    color: var(--text); white-space: pre-wrap;
  }
  .memoir-text.loading { color: var(--muted); font-style: italic; }

  /* ── Empty state ── */
  .empty { text-align: center; padding: 60px 24px; }
  .empty-compass { margin: 0 auto 20px; display: block; }
  .empty-text { font-family: var(--serif); font-size: 18px; font-style: italic; color: var(--muted); margin-bottom: 8px; }
  .empty-sub { font-size: 12px; color: var(--muted); }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: var(--dark); color: #fff;
    font-family: var(--sans); font-size: 12px; font-weight: 500;
    padding: 10px 20px; border-radius: 100px;
    opacity: 0; pointer-events: none; transition: opacity 0.25s;
    z-index: 200;
  }
  .toast.show { opacity: 1; animation: toastIn 0.25s ease; }

  /* ── Share card ── */
  .share-btn {
    margin-top: 10px; font-size: 11px; color: var(--muted);
    background: none; border: 1px solid var(--border);
    border-radius: 100px; padding: 5px 13px; cursor: pointer;
    font-family: var(--sans);
    transition: all 0.15s;
  }
  .share-btn:hover { border-color: var(--accent); color: var(--accent); }
`;

// ─── DATA ────────────────────────────────────────────────────────────────────
const PROMPTS = [
  { id: "surprise", icon: "✦", label: "Cultural contrast", q: "What surprised you today that you wouldn't find at home?" },
  { id: "senses",   icon: "◈", label: "Sensory memory",    q: "Describe a sound or smell you want to remember." },
  { id: "food",     icon: "◉", label: "Taste memory",      q: "What did you eat, and what did it remind you of?" },
  { id: "people",   icon: "◎", label: "Human moment",      q: "Describe a person you saw or spoke to today." },
  { id: "light",    icon: "◐", label: "Light & atmosphere", q: "What did the light look like at a moment you want to keep?" },
  { id: "slow",     icon: "◷", label: "Slow observation",  q: "What did you notice only because you stopped moving?" },
  { id: "feeling",  icon: "◑", label: "Inner state",       q: "What did this place make you feel that you can't explain?" },
];

const EMOTIONS = ["wonder", "longing", "peace", "disoriented", "grateful", "melancholic", "alive", "anonymous", "connected", "curious", "overwhelmed", "nostalgic", "free"];

// ─── SVG COMPONENTS ──────────────────────────────────────────────────────────
function CompassLogo({ spinning = false, size = 40 }: { spinning?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-mark">
      <circle cx="36" cy="36" r="32" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
      {/* Cardinal ticks */}
      <line x1="36" y1="4"  x2="36" y2="11" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="36" y1="61" x2="36" y2="68" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="4"  y1="36" x2="11" y2="36" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="61" y1="36" x2="68" y2="36" stroke="#1a1a1a" strokeWidth="2" />
      {/* Needle group */}
      <g className={spinning ? "compass-loading" : "compass-idle"} style={{ transformOrigin: "36px 36px" }}>
        {/* North = pen nib (green) */}
        <path d="M36,13 L30,34 L36,29 L42,34 Z" fill="#2e7d32" />
        <line x1="36" y1="17" x2="36" y2="29" stroke="#1a1a1a" strokeWidth="0.9" strokeOpacity="0.4" />
        <circle cx="36" cy="12" r="2.8" fill="#2e7d32" />
        {/* South needle (muted) */}
        <path d="M36,59 L30,38 L36,43 L42,38 Z" fill="#1a1a1a" opacity="0.35" />
      </g>
      {/* Centre jewel */}
      <circle cx="36" cy="36" r="5" fill="#1a1a1a" />
      <circle cx="36" cy="36" r="2.5" fill="#2e7d32" />
    </svg>
  );
}

function MountainDivider() {
  return (
    <svg className="divider" viewBox="0 0 640 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M0,28 L80,8 L140,20 L220,2 L300,16 L380,4 L460,18 L540,6 L640,22 L640,32 L0,32 Z"
        fill="none" stroke="#2e7d32" strokeWidth="1.2" strokeLinejoin="round" opacity="0.35"
      />
    </svg>
  );
}

function Bird({ cls }: { cls: string }) {
  return (
    <svg width="22" height="10" viewBox="0 0 22 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls} aria-hidden>
      <path d="M11,5 Q5,0 0,2" stroke="#2e7d32" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M11,5 Q17,0 22,2" stroke="#2e7d32" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<"write" | "journal" | "memoir">("write");
  const [location, setLocation] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [entryText, setEntryText] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [memoir, setMemoir] = useState("");
  const [memoirOpen, setMemoirOpen] = useState(false);
  const [memoirLoading, setMemoirLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const recognitionRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2400);
  };

  const toggleEmotion = (e: string) =>
    setSelectedEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast("Voice not supported in this browser"); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setEntryText(prev => (prev ? prev + " " : "") + transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const saveEntry = () => {
    if (!entryText.trim()) { showToast("Write something first"); return; }
    if (!location.trim()) { showToast("Add a location"); return; }
    setEntries(prev => [{
      id: Date.now(),
      location: location.trim(),
      prompt: PROMPTS[selectedPrompt],
      text: entryText.trim(),
      emotions: [...selectedEmotions],
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    }, ...prev]);
    setEntryText("");
    setSelectedEmotions([]);
    showToast("Entry saved ✦");
  };

  const generateMemoir = async () => {
    if (entries.length === 0) { showToast("Write some entries first"); return; }
    setMemoirOpen(true);
    setMemoirLoading(true);
    setMemoir("");

    const entrySummary = entries.slice(0, 6).map(e =>
      `[${e.location}, ${e.date}]\nPrompt: "${e.prompt.q}"\nEntry: ${e.text}${e.emotions.length ? `\nFelt: ${e.emotions.join(", ")}` : ""}`
    ).join("\n\n---\n\n");

    try {
      const response = await fetch(`${WORKER_URL}/v1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1000,
          system: `You are a literary travel memoir writer for Safarnama — a travel journaling app for slow travellers who experience the world through all senses. You write in a lyrical, sensory, first-person voice — like Pico Iyer or Patrick Leigh Fermor.

Given a traveller's raw journal entries, synthesise them into a short memoir passage (250–350 words) that captures the emotional truth of their travels.

Write as if you are the traveller. Use specific details from their entries. Focus on atmosphere, feeling, and what it means to move through the world this way.

Do NOT use generic travel writing clichés. Make it feel intimate and real. End with a single sentence that captures what travel does to a person.`,
          messages: [{ role: "user", content: `Here are my travel journal entries. Please synthesise them into a personal memoir passage:\n\n${entrySummary}` }],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const data = await response.json();
      setMemoir(data.content?.[0]?.text || "Could not generate memoir. Please try again.");
    } catch (e: any) {
      setMemoir(`Something went wrong: ${e.message ?? "Check your Cloudflare Worker URL and try again."}`);
    } finally {
      setMemoirLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-logo">
            <CompassLogo size={40} />
            <div className="logo-text">
              <span className="logo-en">Safarnama</span>
              <span className="logo-hi">सफ़रनामा · travel journal</span>
            </div>
          </div>
          <div className="header-date">{today}</div>
        </header>

        {/* ── Tabs ── */}
        <nav className="tabs">
          {(["write", "journal", "memoir"] as const).map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "write" ? "New Entry" : t === "journal" ? `Journal (${entries.length})` : "Memoir"}
            </button>
          ))}
        </nav>

        {/* ── Write Tab ── */}
        {tab === "write" && (
          <div className="composer fade-up">
            {/* Location */}
            <div className="loc-row">
              <input
                className="loc-input"
                placeholder="Where are you?"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
              <span className="loc-date">
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Prompt chips */}
            <div className="prompt-chips">
              {PROMPTS.map((p, i) => (
                <button
                  key={p.id}
                  className={`chip ${selectedPrompt === i ? "active" : ""}`}
                  onClick={() => setSelectedPrompt(i)}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Active prompt */}
            <div className="active-prompt">
              <div className="prompt-q">"{PROMPTS[selectedPrompt].q}"</div>
              <div className="prompt-label">{PROMPTS[selectedPrompt].label}</div>
            </div>

            {/* Textarea */}
            <textarea
              className="entry-area"
              placeholder="Write freely, or tap the mic below..."
              value={entryText}
              onChange={e => setEntryText(e.target.value)}
            />

            {/* Emotion tags */}
            <div className="emotion-row">
              <div className="emotion-label">How did it feel?</div>
              <div className="emotion-chips">
                {EMOTIONS.map(em => (
                  <button
                    key={em}
                    className={`emo-chip ${selectedEmotions.includes(em) ? "active" : ""}`}
                    onClick={() => toggleEmotion(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="entry-actions" style={{ marginTop: 20 }}>
              <button
                className={`voice-btn ${isRecording ? "recording" : ""}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                <span className="voice-dot" />
                {isRecording ? "Stop recording" : "Voice entry"}
              </button>
              <button className="save-btn" onClick={saveEntry} disabled={!entryText.trim() || !location.trim()}>
                Save entry
              </button>
            </div>
          </div>
        )}

        {/* ── Journal Tab ── */}
        {tab === "journal" && (
          <div className="journal">
            <MountainDivider />
            {entries.length === 0 ? (
              <div className="empty">
                <CompassLogo size={56} />
                <div className="empty-text" style={{ marginTop: 16 }}>Begin your safarnama.</div>
                <div className="empty-sub">Your entries will appear here.</div>
              </div>
            ) : (
              entries.map(entry => (
                <div key={entry.id} className="entry-card">
                  <div className="entry-meta">
                    <span className="entry-loc">{entry.location}</span>
                    <span className="entry-date">{entry.date}</span>
                  </div>
                  <div className="entry-prompt-tag">{entry.prompt.label}</div>
                  <div className="entry-text">{entry.text}</div>
                  {entry.emotions.length > 0 && (
                    <div className="entry-emotion">felt: {entry.emotions.join(" · ")}</div>
                  )}
                  <button className="share-btn" onClick={() => {
                    navigator.clipboard.writeText(`${entry.location} — ${entry.text}\n\nfrom my Safarnama ✦`);
                    showToast("Copied to clipboard");
                  }}>
                    Share entry
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Memoir Tab ── */}
        {tab === "memoir" && (
          <div className="memoir-section fade-up">
            {/* Birds */}
            <div className="memoir-birds">
              <Bird cls="bird-a" />
              <Bird cls="bird-b" />
              <Bird cls="bird-c" />
              <Bird cls="bird-a" />
              <Bird cls="bird-b" />
            </div>

            <button className="memoir-cta" onClick={generateMemoir}>
              <div className="memoir-cta-left">
                <div className="memoir-title-text">
                  {memoir ? "Regenerate memoir" : "Generate your memoir"}
                </div>
                <div className="memoir-sub">
                  {memoir ? "Create a new synthesis from your entries" : "Let AI find the poetry in your observations"}
                </div>
              </div>
              {memoirLoading ? (
                <CompassLogo spinning size={28} />
              ) : (
                <span className="memoir-arrow">→</span>
              )}
            </button>

            {memoirOpen && (
              <div className="memoir-output">
                {memoirLoading ? (
                  <div className="memoir-text loading shimmer">Writing your safarnama...</div>
                ) : (
                  <>
                    <div className="memoir-text">{memoir}</div>
                    <button className="share-btn" style={{ marginTop: 20 }} onClick={() => {
                      navigator.clipboard.writeText(memoir);
                      showToast("Memoir copied");
                    }}>
                      Copy memoir
                    </button>
                  </>
                )}
              </div>
            )}

            {!memoirOpen && entries.length === 0 && (
              <div className="empty" style={{ paddingTop: 40 }}>
                <div className="empty-text">No entries yet.</div>
                <div className="empty-sub">Write some journal entries first, then generate your memoir.</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`toast ${toastVisible ? "show" : ""}`}>{toast}</div>
    </>
  );
}
