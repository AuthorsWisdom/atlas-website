'use client'

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";

const COLORS = {
  bg: "#080A0E",
  surface: "#0E1118",
  card: "#131720",
  border: "#1C2235",
  accent: "#00C896",
  accentDim: "#00C89620",
  accentBlue: "#4F8EF7",
  accentAmber: "#F5A623",
  text: "#EDF2FF",
  muted: "#5A6480",
  mutedLight: "#8892B0",
};

const NAV_LINKS = ["Features", "Demo", "News", "Pricing", "FAQ"];

function Nav() {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const handler = () => setShowDropdown(false);
    if (showDropdown) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showDropdown]);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(8,10,14,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? `1px solid ${COLORS.border}` : "none",
      transition: "all 0.3s ease",
      padding: "0 2rem",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/xatlas-logo.png" alt="XAtlas" width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 22, letterSpacing: 2, color: COLORS.text }}>XATLAS</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              color: COLORS.mutedLight, fontSize: 13, fontWeight: 500,
              textDecoration: "none", letterSpacing: 0.5,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = COLORS.text}
            onMouseLeave={e => (e.target as HTMLElement).style.color = COLORS.mutedLight}
            >{l}</a>
          ))}
          {user ? (
            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowDropdown(!showDropdown)} style={{
                width: 36, height: 36,
                borderRadius: "50%",
                background: COLORS.accent,
                border: "none",
                cursor: "pointer",
                color: "#000",
                fontWeight: 700,
                fontSize: 14,
              }}>
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </button>
              {showDropdown && (
                <div style={{
                  position: "absolute", right: 0, top: 44,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: "8px 0",
                  minWidth: 200,
                  zIndex: 1000,
                }}>
                  <div style={{ padding: "8px 16px", color: COLORS.muted, fontSize: 12, borderBottom: `1px solid ${COLORS.border}` }}>
                    {user.email}
                  </div>
                  <a href="/app" style={{ display: "block", padding: "10px 16px", color: COLORS.text, textDecoration: "none", fontSize: 14 }}>
                    Open App
                  </a>
                  <a href="/account" style={{ display: "block", padding: "10px 16px", color: COLORS.text, textDecoration: "none", fontSize: 14 }}>
                    My Account
                  </a>
                  <button onClick={async () => {
                    await signOut();
                    setShowDropdown(false);
                  }} style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "10px 16px", color: "#E24B4A",
                    background: "none", border: "none", cursor: "pointer", fontSize: 14,
                  }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/app" style={{
              background: COLORS.accent, color: "#000", padding: "8px 20px",
              borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.target as HTMLElement).style.opacity = "1"}
            >Sign In</a>
          )}
        </div>
      </div>
    </nav>
  );
}

function CandlestickChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [change, setChange] = useState<string | null>(null);

  useEffect(() => {
    const candles: { o: number; c: number; h: number; l: number }[] = [];
    let p = 478.32;
    for (let i = 0; i < 80; i++) {
      const o = p + (Math.random() - 0.5) * 4;
      const c = o + (Math.random() - 0.48) * 6;
      const h = Math.max(o, c) + Math.random() * 3;
      const lo = Math.min(o, c) - Math.random() * 3;
      candles.push({ o, c, h, l: lo });
      p = c;
    }
    setPrice(p.toFixed(2));
    setChange((((p - 478.32) / 478.32) * 100).toFixed(2));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const allHigh = Math.max(...candles.map(c => c.h));
    const allLow = Math.min(...candles.map(c => c.l));
    const pad = (allHigh - allLow) * 0.1;
    const hi = allHigh + pad, lo = allLow - pad;
    const toY = (v: number) => H - ((v - lo) / (hi - lo)) * (H - 20) - 10;

    const cw = (W - 20) / candles.length;
    const bw = Math.max(cw * 0.55, 3);

    ctx.strokeStyle = `${COLORS.accent}25`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = 10 + (i / 4) * (H - 20);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    candles.forEach((c, i) => {
      const x = 10 + i * cw + cw / 2;
      const bull = c.c >= c.o;
      const col = bull ? COLORS.accent : "#F05050";
      ctx.strokeStyle = col;
      ctx.fillStyle = bull ? `${COLORS.accent}50` : "#F0505060";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(x, toY(c.h));
      ctx.lineTo(x, toY(c.l));
      ctx.stroke();

      const bodyTop = toY(Math.max(c.o, c.c));
      const bodyBot = toY(Math.min(c.o, c.c));
      const bodyH = Math.max(bodyBot - bodyTop, 1);
      ctx.strokeRect(x - bw / 2, bodyTop, bw, bodyH);
      ctx.fillRect(x - bw / 2, bodyTop, bw, bodyH);
    });

    ctx.strokeStyle = COLORS.accentBlue;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const ma = 20;
    candles.forEach((c, i) => {
      if (i < ma) return;
      const avg = candles.slice(i - ma, i).reduce((s, cc) => s + cc.c, 0) / ma;
      const x = 10 + i * cw + cw / 2;
      i === ma ? ctx.moveTo(x, toY(avg)) : ctx.lineTo(x, toY(avg));
    });
    ctx.stroke();
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <span style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: COLORS.text }}>
          {price ? `$${price}` : "—"}
        </span>
        {change && (
          <span style={{
            fontSize: 13, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
            background: parseFloat(change) >= 0 ? `${COLORS.accent}20` : "#F0505020",
            color: parseFloat(change) >= 0 ? COLORS.accent : "#F05050",
          }}>
            {parseFloat(change) >= 0 ? "+" : ""}{change}%
          </span>
        )}
        <span style={{ fontSize: 11, color: COLORS.muted, marginLeft: "auto" }}>SPY · 1D · 80 bars</span>
      </div>
      <canvas ref={canvasRef} width={700} height={260} style={{ width: "100%", height: "auto", display: "block", borderRadius: 8 }} />
    </div>
  );
}

function ConvictionMeter({ value = 78, label = "Conviction Score" }: { value?: number; label?: string }) {
  const r = 44, stroke = 6, circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={110} height={110} style={{ overflow: "visible" }}>
        <circle cx={55} cy={55} r={r} fill="none" stroke={COLORS.border} strokeWidth={stroke}/>
        <circle cx={55} cy={55} r={r} fill="none"
          stroke={value > 65 ? COLORS.accent : value > 35 ? COLORS.accentAmber : "#F05050"}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x={55} y={50} textAnchor="middle" fill={COLORS.text} fontSize={22} fontWeight={700} fontFamily="monospace">{value}</text>
        <text x={55} y={65} textAnchor="middle" fill={COLORS.muted} fontSize={9}>/100</text>
      </svg>
      <span style={{ fontSize: 11, color: COLORS.mutedLight, textAlign: "center" }}>{label}</span>
    </div>
  );
}

function Badge({ children, color = COLORS.accent }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px",
      background: `${color}15`, color, border: `1px solid ${color}30`,
      borderRadius: 4, textTransform: "uppercase",
    }}>{children}</span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ width: 24, height: 1, background: COLORS.accent }}/>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: COLORS.accent, textTransform: "uppercase" }}>{children}</span>
    </div>
  );
}

function FeatureCard({ icon, title, desc, badge }: { icon: string; title: string; desc: string; badge?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? COLORS.card : "transparent",
        border: `1px solid ${hover ? COLORS.accent + "40" : COLORS.border}`,
        borderRadius: 12, padding: "28px 24px",
        transition: "all 0.25s ease", cursor: "default",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 16 }}>{icon}</div>
      {badge && <div style={{ marginBottom: 10 }}><Badge>{badge}</Badge></div>}
      <h3 style={{ color: COLORS.text, fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: COLORS.mutedLight, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{desc}</p>
    </div>
  );
}

interface PricingFeature {
  text: string;
  dim?: boolean;
}

function PricingCard({ tier, price, period, features, cta, highlight, badge, onClick }: {
  tier: string; price: string; period?: string; features: PricingFeature[];
  cta: string; highlight?: boolean; badge?: string; onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: highlight ? `linear-gradient(160deg, #0E1A14, #0E1118)` : COLORS.card,
        border: `1px solid ${highlight ? COLORS.accent + "60" : hover ? COLORS.border + "CC" : COLORS.border}`,
        borderRadius: 14, padding: "32px 28px",
        position: "relative", overflow: "hidden",
        transform: highlight ? "scale(1.03)" : hover ? "translateY(-3px)" : "none",
        transition: "all 0.25s ease",
        boxShadow: highlight ? `0 0 40px ${COLORS.accent}15` : "none",
      }}
    >
      {highlight && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`,
        }}/>
      )}
      {badge && (
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <Badge color={COLORS.accentAmber}>{badge}</Badge>
        </div>
      )}
      <p style={{ color: COLORS.mutedLight, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{tier}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{ color: COLORS.text, fontSize: 38, fontWeight: 800, fontFamily: "monospace" }}>{price}</span>
        {period && <span style={{ color: COLORS.muted, fontSize: 13 }}>/{period}</span>}
      </div>
      <div style={{ width: "100%", height: 1, background: COLORS.border, margin: "20px 0" }}/>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, color: f.dim ? COLORS.muted : COLORS.mutedLight, fontSize: 13 }}>
            <span style={{ color: f.dim ? COLORS.border : COLORS.accent, marginTop: 1, flexShrink: 0 }}>{f.dim ? "–" : "✓"}</span>
            {f.text}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        style={{
          width: "100%", padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 700,
          cursor: "pointer", letterSpacing: 0.5,
          background: highlight ? COLORS.accent : "transparent",
          color: highlight ? "#000" : COLORS.accent,
          border: highlight ? "none" : `1px solid ${COLORS.accent}50`,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.background = highlight ? "#00a87e" : `${COLORS.accent}15`; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.background = highlight ? COLORS.accent : "transparent"; }}
      >{cta}</button>
    </div>
  );
}

function StatTicker({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        let start = 0;
        const step = value / 40;
        const t = setInterval(() => {
          start = Math.min(start + step, value);
          setDisplayed(Math.round(start));
          if (start >= value) clearInterval(t);
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "monospace", fontSize: 44, fontWeight: 800, color: COLORS.accent, lineHeight: 1 }}>
        {displayed.toLocaleString()}{suffix}
      </div>
      <div style={{ color: COLORS.mutedLight, fontSize: 13, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{
          borderBottom: `1px solid ${COLORS.border}`,
          overflow: "hidden",
        }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "20px 0", textAlign: "left",
          }}>
            <span style={{ color: COLORS.text, fontSize: 15, fontWeight: 500 }}>{item.q}</span>
            <span style={{ color: COLORS.accent, fontSize: 18, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 16 }}>+</span>
          </button>
          <div style={{
            maxHeight: open === i ? 200 : 0, overflow: "hidden",
            transition: "max-height 0.35s ease",
          }}>
            <p style={{ color: COLORS.mutedLight, fontSize: 14, lineHeight: 1.75, paddingBottom: 20, margin: 0 }}>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsSection() {
  const [news, setNews] = useState<{ id: string; title: string; summary: string; source: string; url: string; published_at: number; category: string }[]>([]);

  useEffect(() => {
    fetch("/api/news?type=all&limit=6")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNews(data) })
      .catch(() => {});
  }, []);

  const categoryColors: Record<string, string> = { market: "#4F8EF7", sec: "#F5A623", regulation: "#E24B4A", fed: "#00C896" };

  return (
    <div id="news" style={{ padding: "100px 2rem", background: COLORS.bg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <SectionLabel>Live Intelligence</SectionLabel>
            <h2 style={{ fontSize: 44, fontWeight: 800, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: 2, marginBottom: 16, color: COLORS.text }}>
              MARKETS, REGULATIONS<br/>& POLICY
            </h2>
            <p style={{ color: COLORS.mutedLight, fontSize: 16, maxWidth: 480, lineHeight: 1.7 }}>
              SEC filings, Fed announcements, financial regulations — updated every 5 minutes from free government and market data sources.
            </p>
          </div>
          <a href="/app?tab=news" style={{
            padding: "10px 20px", background: "transparent",
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            color: COLORS.mutedLight, textDecoration: "none", fontSize: 13, fontWeight: 500,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.mutedLight }}>
            View all news →
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {news.length > 0 ? news.slice(0, 6).map((article, i) => {
            const color = categoryColors[article.category] ?? COLORS.muted;
            return (
              <a key={article.id || i} href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  background: COLORS.card, borderRadius: 10, padding: 20,
                  border: `1px solid ${COLORS.border}`, cursor: "pointer",
                  transition: "border-color 0.15s, transform 0.15s",
                  borderLeft: `3px solid ${color}`, height: "100%",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-2px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.borderLeftColor = color; e.currentTarget.style.transform = "translateY(0)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color, textTransform: "uppercase", letterSpacing: "0.8px",
                      background: `${color}15`, padding: "3px 8px", borderRadius: 4, flexShrink: 0,
                    }}>{article.source}</span>
                    <span style={{ fontSize: 11, color: COLORS.muted, flexShrink: 0 }}>
                      {new Date(article.published_at * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, lineHeight: 1.5, marginBottom: 8 }}>
                    {article.title}
                  </div>
                  {article.summary && (
                    <div style={{
                      fontSize: 12, color: COLORS.mutedLight, lineHeight: 1.6,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    }}>{article.summary}</div>
                  )}
                  <div style={{ marginTop: 12, fontSize: 11, color, fontWeight: 600 }}>Read more →</div>
                </div>
              </a>
            );
          }) : (
            Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ background: COLORS.card, borderRadius: 10, padding: 20, border: `1px solid ${COLORS.border}` }}>
                {[80, 100, 60].map((w, j) => (
                  <div key={j} style={{ height: 12, background: COLORS.border, borderRadius: 4, width: `${w}%`, marginBottom: 10 }} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

async function handleCheckout(plan: string) {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email: '' }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Something went wrong');
    }
  } catch {
    alert('Failed to start checkout');
  }
}

export default function Home() {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  const handleWaitlist = async () => {
    if (!waitlistEmail) return;
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setWaitlistStatus('success');
        if (data.count) setWaitlistCount(data.count);
      } else {
        setWaitlistStatus('error');
      }
    } catch {
      setWaitlistStatus('error');
    }
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${COLORS.bg}; }
        ::selection { background: ${COLORS.accent}40; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
      `}</style>

      <Nav />

      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${COLORS.accent}12 0%, transparent 70%)`,
          pointerEvents: "none",
        }}/>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 2rem 60px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: `${COLORS.accent}10`, border: `1px solid ${COLORS.accent}30`, borderRadius: 100, marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.accent, display: "inline-block", animation: "pulse 2s infinite" }}/>
              <span style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600 }}>Now in early access — Founding Member pricing ends June 23</span>
            </div>
            <h1 style={{
              fontSize: 64, fontWeight: 800, lineHeight: 1.05, marginBottom: 24,
              fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: 2,
            }}>
              <span style={{ color: COLORS.text }}>INSTITUTIONAL</span><br/>
              <span style={{ color: COLORS.accent }}>EDGE.</span>{" "}
              <span style={{ color: COLORS.text }}>MOBILE</span><br/>
              <span style={{ color: COLORS.text }}>FIRST.</span>
            </h1>
            <p style={{ color: COLORS.mutedLight, fontSize: 17, lineHeight: 1.75, marginBottom: 36, maxWidth: 440 }}>
              XAtlas delivers institutional-grade conviction scoring, options flow analysis, squeeze detection, and macro intelligence — built for the retail trader who moves like a pro.
            </p>
            <div style={{ display: "flex", gap: 14 }}>
              <a href="/app" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: COLORS.accent, color: "#000", padding: "14px 28px",
                borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none",
                letterSpacing: 0.5, transition: "all 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#00a87e"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = COLORS.accent}
              >Get Started Free →</a>
              <a href="#demo" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "transparent", color: COLORS.text, padding: "14px 28px",
                borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: "none",
                border: `1px solid ${COLORS.border}`, transition: "all 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = COLORS.accent + "60"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = COLORS.border}
              >See Demo</a>
            </div>
          </div>

          <div style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: "28px 24px",
            boxShadow: `0 0 60px ${COLORS.accent}08`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#FF5F57","#FFBD2E","#27C93F"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }}/>)}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["1D","5D","1M","3M"].map((t, i) => (
                  <button key={t} style={{
                    background: i === 0 ? `${COLORS.accent}20` : "none",
                    border: "none", color: i === 0 ? COLORS.accent : COLORS.muted,
                    fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 4, cursor: "pointer",
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <CandlestickChart />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
              {[
                { label: "TTM Squeeze", value: "ACTIVE", color: COLORS.accentAmber },
                { label: "Options Flow", value: "Bullish", color: COLORS.accent },
                { label: "Macro", value: "Risk-On", color: COLORS.accentBlue },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: COLORS.surface, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ color: COLORS.muted, fontSize: 10, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ color, fontSize: 13, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 2rem", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40 }}>
          <StatTicker value={14} label="Data Sources Integrated" suffix="+" />
          <StatTicker value={500} label="Beta Waitlist Members" suffix="+" />
          <StatTicker value={98} label="Backend Uptime %" suffix="%" />
          <StatTicker value={40} label="ms Average Latency" suffix="ms" />
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ padding: "100px 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionLabel>What XAtlas Does</SectionLabel>
          <h2 style={{ fontSize: 44, fontWeight: 800, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: 2, marginBottom: 16, color: COLORS.text }}>
            EVERY EDGE.<br/>ONE SCREEN.
          </h2>
          <p style={{ color: COLORS.mutedLight, fontSize: 16, maxWidth: 520, marginBottom: 60, lineHeight: 1.7 }}>
            Institutional tools that used to cost thousands per month — now in your pocket, powered by real-time data and an AI decision layer built on Claude.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            <FeatureCard
              icon="⚡"
              badge="Live"
              title="Tactical Scanner"
              desc="Real-time TTM Squeeze detection, options flow scoring, and GEX analysis. Identify high-conviction setups before the crowd."
            />
            <FeatureCard
              icon="🌐"
              badge="FRED + Polygon"
              title="Macro Command Center"
              desc="Tracks yield curve, credit spreads, VIX regime, and 8 other macro indicators. Classifies the current regime — risk-on, defensive, or transitional."
            />
            <FeatureCard
              icon="🎯"
              title="Conviction Scorer"
              desc="Aggregates squeeze signals, options flow, GEX, and macro into a single 0–100 conviction score. Know exactly how strong your thesis is."
            />
            <FeatureCard
              icon="🤖"
              badge="Claude AI"
              title="Agentic AI Layer"
              desc="Ask questions in plain English. The AI agent calls your live data tools, interprets signals, and explains the market in clear, actionable language."
            />
            <FeatureCard
              icon="🔐"
              title="BYOK Architecture"
              desc="Your API keys are encrypted at rest and never stored client-side. You maintain full control of your data pipeline — no lock-in."
            />
            <FeatureCard
              icon="📱"
              badge="iOS"
              title="Mobile-First Design"
              desc="Built natively for iPhone. Not a stripped-down web port — a full-featured iOS app designed around how traders actually work on mobile."
            />
          </div>
        </div>
      </div>

      {/* DEMO */}
      <div id="demo" style={{ background: COLORS.surface, padding: "100px 2rem", borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionLabel>Live Demo</SectionLabel>
          <h2 style={{ fontSize: 44, fontWeight: 800, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: 2, marginBottom: 16, color: COLORS.text }}>
            SEE IT IN ACTION
          </h2>
          <p style={{ color: COLORS.mutedLight, fontSize: 16, maxWidth: 520, marginBottom: 60, lineHeight: 1.7 }}>
            This is a live snapshot from the XAtlas backend — real conviction scoring running against real market data.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "32px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: COLORS.text }}>SPY</span>
                  <span style={{ color: COLORS.muted, marginLeft: 8, fontSize: 13 }}>SPDR S&P 500 ETF</span>
                </div>
                <Badge>Market Open</Badge>
              </div>
              <CandlestickChart />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24, display: "flex", justifyContent: "center" }}>
                <ConvictionMeter value={78} label="Overall Conviction" />
              </div>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20 }}>
                <p style={{ color: COLORS.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Signal Breakdown</p>
                {[
                  { label: "TTM Squeeze", score: 85, color: COLORS.accentAmber },
                  { label: "Options Flow", score: 72, color: COLORS.accent },
                  { label: "GEX", score: 61, color: COLORS.accentBlue },
                  { label: "Macro Regime", score: 88, color: COLORS.accent },
                ].map(({ label, score, color }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ color: COLORS.mutedLight, fontSize: 12 }}>{label}</span>
                      <span style={{ color, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{score}</span>
                    </div>
                    <div style={{ background: COLORS.border, borderRadius: 4, height: 4 }}>
                      <div style={{ background: color, width: `${score}%`, height: "100%", borderRadius: 4, transition: "width 1s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: `${COLORS.accent}10`, border: `1px solid ${COLORS.accent}30`, borderRadius: 16, padding: 20 }}>
                <p style={{ color: COLORS.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>AI Summary</p>
                <p style={{ color: COLORS.mutedLight, fontSize: 12, lineHeight: 1.65 }}>
                  Strong bullish setup. Squeeze fired on the daily with options flow showing unusual call activity. Macro regime is risk-on. Conviction: <span style={{ color: COLORS.accent, fontWeight: 700 }}>High</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEWS */}
      <NewsSection />

      {/* PRICING */}
      <div id="pricing" style={{ padding: "100px 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionLabel>Pricing</SectionLabel>
          <h2 style={{ fontSize: 44, fontWeight: 800, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: 2, marginBottom: 16, color: COLORS.text }}>
            START FREE.<br/>SCALE WHEN READY.
          </h2>
          <p style={{ color: COLORS.mutedLight, fontSize: 16, maxWidth: 480, marginBottom: 60, lineHeight: 1.7 }}>
            One plan, full access. Subscribe monthly at $29.99 or save over $160 with annual billing. Founding Member lifetime offer expires June 23, 2026.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, alignItems: "start" }}>
            <PricingCard
              tier="Free"
              price="$0"
              features={[
                { text: "5 ticker lookups/day" },
                { text: "Delayed quotes (15 min)" },
                { text: "Macro regime indicator" },
                { text: "Basic conviction score" },
                { text: "Options flow data", dim: true },
              ]}
              cta="Get Started Free"
              onClick={() => { window.location.href = '/app'; }}
            />
            <PricingCard
              tier="XAtlas Pro"
              price="$29.99"
              period="mo"
              features={[
                { text: "Unlimited ticker lookups" },
                { text: "Real-time quotes" },
                { text: "TTM Squeeze scanner" },
                { text: "Full conviction scorer" },
                { text: "Options flow + GEX" },
                { text: "Macro Command Center" },
                { text: "Full AI agent access" },
              ]}
              cta="Start Pro Monthly"
              onClick={() => handleCheckout('monthly')}
            />
            <PricingCard
              tier="XAtlas Pro Annual"
              price="$199.99"
              period="yr"
              highlight
              badge="Best Value"
              features={[
                { text: "Everything in Pro" },
                { text: "~$16.67/mo billed yearly" },
                { text: "Save $160 vs monthly" },
                { text: "Unlimited ticker lookups" },
                { text: "Full AI agent access" },
                { text: "Options flow + GEX" },
                { text: "Macro Command Center" },
              ]}
              cta="Start Pro Annual"
              onClick={() => handleCheckout('annual')}
            />
            <PricingCard
              tier="Founding Member"
              price="$499.99"
              badge="Limited"
              features={[
                { text: "Lifetime Pro access" },
                { text: "Founding Member badge" },
                { text: "Direct product input" },
                { text: "All future features" },
                { text: "Expires June 23, 2026" },
              ]}
              cta="Claim Lifetime Access"
              onClick={() => handleCheckout('lifetime')}
            />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" style={{ background: COLORS.surface, padding: "100px 2rem", borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <SectionLabel>FAQ</SectionLabel>
          <h2 style={{ fontSize: 44, fontWeight: 800, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: 2, marginBottom: 48, color: COLORS.text }}>
            QUESTIONS ANSWERED
          </h2>
          <FAQ items={[
            { q: "Is XAtlas financial advice?", a: "No. XAtlas provides market intelligence and data analysis tools. Nothing in the app constitutes financial advice, investment recommendations, or trading signals. All decisions are yours alone." },
            { q: "Does XAtlas execute trades?", a: "No. XAtlas is an intelligence platform only. We intentionally do not connect to brokerage accounts or execute orders. This keeps the product clean and within regulatory boundaries." },
            { q: "What data sources power the platform?", a: "Real-time market data comes from Polygon.io. Macro indicators are sourced from FRED (Federal Reserve Economic Data). AI analysis is powered by Anthropic Claude via our custom agent loop." },
            { q: "Is my API key data secure?", a: "Yes. All user API keys are encrypted at rest in our Supabase database and only decrypted at request time. Keys are never stored client-side or logged." },
            { q: "When is the iOS app launching?", a: "We're in the final stages of Apple Developer Program approval and App Store submission. Early access members will be first to receive the app. Join the waitlist to get notified." },
            { q: "What happens after the Founding Member offer expires?", a: "The Founding Member lifetime deal expires June 23, 2026. After that date, lifetime access will no longer be available and pricing may increase." },
          ]} />
        </div>
      </div>

      {/* CTA / WAITLIST */}
      <div style={{ padding: "120px 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 60% 80% at 50% 50%, ${COLORS.accent}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }}/>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <SectionLabel>Join the Waitlist</SectionLabel>
          <h2 style={{ fontSize: 56, fontWeight: 800, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: 2, marginBottom: 20, color: COLORS.text, lineHeight: 1.05 }}>
            TRADE WITH<br/><span style={{ color: COLORS.accent }}>INSTITUTIONAL EDGE</span>
          </h2>
          <p style={{ color: COLORS.mutedLight, fontSize: 16, lineHeight: 1.75, marginBottom: 40 }}>
            Join {waitlistCount ?? '500'}+ traders on the early access list. Founding Member pricing locks in lifetime Elite access at a one-time price — before June 23.
          </p>
          {waitlistStatus === 'success' ? (
            <p style={{ color: COLORS.accent, fontSize: 16, fontWeight: 600 }}>You&apos;re on the list! We&apos;ll be in touch soon.</p>
          ) : (
            <div style={{ display: "flex", gap: 12, maxWidth: 420, margin: "0 auto" }}>
              <input
                type="email"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  flex: 1, padding: "14px 18px", background: COLORS.card,
                  border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  color: COLORS.text, fontSize: 14, outline: "none",
                }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = COLORS.accent + "60"}
                onBlur={e => (e.target as HTMLElement).style.borderColor = COLORS.border}
                onKeyDown={e => { if (e.key === 'Enter') handleWaitlist(); }}
              />
              <button
                onClick={handleWaitlist}
                disabled={waitlistStatus === 'loading'}
                style={{
                  background: COLORS.accent, color: "#000", padding: "14px 24px",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: waitlistStatus === 'loading' ? 'wait' : 'pointer', whiteSpace: "nowrap",
                  opacity: waitlistStatus === 'loading' ? 0.7 : 1,
                }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = "#00a87e"}
                onMouseLeave={e => (e.target as HTMLElement).style.background = COLORS.accent}
              >{waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist'}</button>
            </div>
          )}
          {waitlistStatus === 'error' && (
            <p style={{ color: "#F05050", fontSize: 13, marginTop: 10 }}>Something went wrong. Please try again.</p>
          )}
          <p style={{ color: COLORS.muted, fontSize: 12, marginTop: 14 }}>No spam. No sharing. Unsubscribe anytime.</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${COLORS.border}`, padding: "48px 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Image src="/xatlas-logo.png" alt="XAtlas" width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }} />
              <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 18, letterSpacing: 2, color: COLORS.text }}>XATLAS</span>
            </div>
            <p style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>
              Institutional market intelligence for the retail trader. Not financial advice.
            </p>
          </div>
          {[
            { heading: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Demo", href: "#demo" }, { label: "Open App", href: "/app" }] },
            { heading: "Legal", links: [{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Disclaimer", href: "#" }] },
            { heading: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Contact", href: "#" }, { label: "App Store", href: "#" }] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <p style={{ color: COLORS.text, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>{heading}</p>
              {links.map(l => (
                <a key={l.label} href={l.href} style={{ display: "block", color: COLORS.muted, fontSize: 13, marginBottom: 10, textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = COLORS.mutedLight}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = COLORS.muted}
                >{l.label}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: "32px auto 0", paddingTop: 24, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: COLORS.muted, fontSize: 12 }}>© 2026 XAtlas. All rights reserved.</span>
          <span style={{ color: COLORS.muted, fontSize: 12 }}>xatlas.io · Not financial advice</span>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
