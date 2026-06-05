import { useState, type MouseEvent } from "react";
import ExpandingCards from "./components/ExpandingCards";
import ContactForm from "./components/ContactForm";
import ChatWidget from "./components/ChatWidget";
import AuthModal from "./components/AuthModal";
import { useSiteEffects } from "./lib/effects";

/** Tester.io brand logo mark — the real asset (brand_assets/Tester Logo.png).
 *  Pass `className` for responsive sizing, or `size` for a fixed px square. */
function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/tester-logo.png"
      alt=""
      draggable={false}
      className={className ?? "block select-none"}
      style={className ? undefined : { width: size, height: size }}
    />
  );
}

/** Distinctive company logo-lockups for the "trusted by" rail.
 *  Each mark is a custom geometric glyph (not a generic dingbat) in the gold line style. */
const TRUST_LOGOS: { name: string; mark: JSX.Element }[] = [
  {
    name: "Northpeak",
    mark: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M3 19 8.5 8l3.5 6 2-3.5L21 19z" />
      </svg>
    ),
  },
  {
    name: "Helix",
    mark: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <ellipse cx="12" cy="12" rx="9" ry="4" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
      </svg>
    ),
  },
  {
    name: "Vault",
    mark: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M12 3 4 6v5c0 4.4 3.2 7.5 8 9 4.8-1.5 8-4.6 8-9V6z" />
        <circle cx="12" cy="11" r="2.2" />
      </svg>
    ),
  },
  {
    name: "Quantum",
    mark: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <circle cx="5" cy="6" r="1.8" /><circle cx="19" cy="6" r="1.8" /><circle cx="12" cy="18" r="1.8" />
        <path d="M6.5 7 11 16.5M17.5 7 13 16.5M6.5 6h11" />
      </svg>
    ),
  },
  {
    name: "Beacon",
    mark: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="12" cy="12" r="2.4" />
        <path d="M7.5 7.5a6 6 0 0 0 0 9M16.5 7.5a6 6 0 0 1 0 9M4.7 4.7a10 10 0 0 0 0 14.6M19.3 4.7a10 10 0 0 1 0 14.6" />
      </svg>
    ),
  },
  {
    name: "Cobalt",
    mark: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M12 3 20 7.5v9L12 21 4 16.5v-9z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </svg>
    ),
  },
];

/** Roadmap milestones — drives the connector progress + per-node status. */
const ROADMAP: { year: string; status: string; done: boolean; desc: string; icon: JSX.Element }[] = [
  { year: "2014", status: "Shipped", done: true, desc: "Definitions of key terms in cryptocurrency.", icon: <path d="M6 21V4h11l-2.5 4L17 12H6" /> },
  { year: "2017", status: "Shipped", done: true, desc: "Automated tools for executing strategies.", icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></> },
  { year: "2022", status: "In progress", done: false, desc: "APIs for developers to build custom tools.", icon: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" /> },
  { year: "2025", status: "Planned", done: false, desc: "A space for users to discuss trends.", icon: <path d="M4 5h16v10H9l-5 4z" /> },
];

export default function App() {
  useSiteEffects();

  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
  const [leaving, setLeaving] = useState(false);

  /** Smoothly scroll to the contact form under the hero. */
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Play the gold iris transition, then navigate to the Tester Tech page. */
  const exploreTesterTech = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let new-tab / modified clicks behave normally
    e.preventDefault();
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      window.location.href = "/TesterTech.html";
      return;
    }
    setLeaving(true);
    window.setTimeout(() => { window.location.href = "/TesterTech.html"; }, 820);
  };

  return (
    <>
      {/* ===== SHADER INTRO (5s) ===== */}
      <div id="loader" aria-hidden="true">
        <canvas id="intro-canvas" />
        <div className="intro-vignette" />
        <div className="intro-content">
          <img className="intro-logo" src="/tester-logo.png" width={88} height={88} alt="" draggable={false} />
          <div className="intro-title text-[42px] sm:text-[58px] font-extrabold tracking-tightest leading-none">Tester<span className="text-gold-grad">.io</span></div>
          <div className="intro-sub text-[11px] uppercase tracking-[.36em] text-mute">The future of leverage</div>
          <div className="intro-bar"><i /></div>
        </div>
      </div>

      {/* background */}
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "radial-gradient(800px 480px at 50% -6%, rgba(230,185,121,.10), transparent 62%), radial-gradient(700px 600px at 90% 12%, rgba(198,165,89,.06), transparent 60%), linear-gradient(180deg,#0A0A0A,#070707)" }} />
      </div>

      {/* ===== NAV ===== */}
      <header className="sticky top-0 z-50">
        <div className="bg-night-950/85 border-b border-white/[.06]">
          <nav className="mx-auto max-w-7xl 2xl:max-w-[92rem] px-5 lg:px-8 2xl:px-12 h-[64px] 2xl:h-[84px] flex items-center justify-between">
            <a href="#top" className="flex items-center gap-2.5 2xl:gap-3 group" aria-label="Tester.io home">
              <span className="w-7 h-7 2xl:w-10 2xl:h-10 transition-transform duration-500 group-hover:scale-105" style={{ transitionTimingFunction: "var(--ease-spring)" }}>
                <Logo className="w-full h-full block select-none" />
              </span>
              <span className="text-[17px] 2xl:text-[22px] font-extrabold tracking-tight">Tester<span className="text-gold-grad">.io</span></span>
            </a>
            <div className="hidden md:flex items-center gap-7 2xl:gap-10 text-[13.5px] 2xl:text-[16px] font-medium text-mute">
              <a href="#top" className="text-white hover:text-gold-200 transition-colors duration-300">Home</a>
              <a href="#features" className="hover:text-gold-200 transition-colors duration-300">Features</a>
              <a href="#token" className="hover:text-gold-200 transition-colors duration-300">Token</a>
              <a href="#how" className="hover:text-gold-200 transition-colors duration-300">How it works</a>
              <a href="#roadmap" className="hover:text-gold-200 transition-colors duration-300">Roadmap</a>
              <a href="#products" className="hover:text-gold-200 transition-colors duration-300">Products</a>
              <button type="button" onClick={scrollToContact} className="hover:text-gold-200 transition-colors duration-300">Contact</button>
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={scrollToContact} className="hidden sm:inline-flex items-center text-[13px] 2xl:text-[16px] font-bold btn-ghost rounded-full px-5 py-2.5 2xl:px-7 2xl:py-3">Contact</button>
              <button type="button" onClick={() => setAuthMode("login")} data-magnetic className="inline-flex items-center text-[13px] 2xl:text-[16px] font-bold btn-gold rounded-full px-5 py-2.5 2xl:px-7 2xl:py-3">Log in</button>
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 dots" />
          <div aria-hidden="true" className="hidden lg:block absolute left-10 top-1/3 floaty w-24 h-24 rounded-full border border-gold-500/20" />
          <div aria-hidden="true" className="hidden lg:block absolute right-12 top-[26%] floaty-slow w-32 h-32 rounded-3xl border border-gold-500/15 rotate-12" />

          <div className="relative mx-auto max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-5 pt-16 pb-10 lg:pt-20 2xl:pt-24 text-center">
            <span className="rise inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 2xl:px-5 2xl:py-2.5 text-[12px] 2xl:text-[14px] font-semibold text-gold-200" style={{ animationDelay: ".05s" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-gold-300" /> Built on Web3. Powered by You
            </span>

            <h1 className="rise mt-7 2xl:mt-9 text-[44px] sm:text-[60px] lg:text-[72px] xl:text-[92px] 2xl:text-[110px] font-extrabold tracking-tightest leading-[1.02]" style={{ animationDelay: ".12s" }}>
              The <span className="text-gold-grad">future</span> of<br />leverage is here
            </h1>

            <p className="rise mx-auto mt-6 2xl:mt-8 max-w-xl xl:max-w-2xl text-[16px] xl:text-[19px] 2xl:text-[21px] leading-[1.7] font-medium text-mute" style={{ animationDelay: ".2s" }}>
              Leverage on any tokens with a product trusted by billions for its performance and reliability.
            </p>

            <form className="rise mx-auto mt-8 2xl:mt-10 flex flex-col sm:flex-row items-stretch gap-2.5 max-w-lg xl:max-w-xl" style={{ animationDelay: ".28s" }} onSubmit={(e) => e.preventDefault()}>
              <div className="flex items-center gap-2.5 flex-1 rounded-full chip px-4 py-3 2xl:px-5 2xl:py-4">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="2xl:w-5 2xl:h-5"><path d="M4 6h16v12H4z" stroke="#8A8A8F" strokeWidth="1.6" /><path d="m4 7 8 6 8-6" stroke="#8A8A8F" strokeWidth="1.6" /></svg>
                <input type="email" placeholder="Business email" className="bg-transparent w-full text-[14px] 2xl:text-[16px] text-white placeholder:text-mute outline-none" />
              </div>
              <button type="submit" onClick={() => setAuthMode("signup")} data-magnetic className="inline-flex items-center justify-center gap-2 text-[13px] 2xl:text-[15px] font-bold btn-gold rounded-full px-6 py-3 2xl:px-8 2xl:py-4 whitespace-nowrap">Get Early Access</button>
            </form>
            <p className="rise mt-4 text-[13px] 2xl:text-[15px] font-medium text-mute" style={{ animationDelay: ".34s" }}>Start monitoring for free or message us!</p>

            {/* central 3D object */}
            <div id="hero-stage" className="relative mx-auto mt-6 h-[260px] sm:h-[320px] lg:h-[380px] 2xl:h-[460px] w-full max-w-2xl 2xl:max-w-3xl">
              <canvas id="hero-canvas" />
              <div className="hero-orb-fallback absolute inset-0 grid place-items-center">
                <div className="emblem w-44 h-44 sm:w-56 sm:h-56 floaty">
                  <Logo size={72} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CONTACT FORM (under hero) ===== */}
        <ContactForm />

        {/* ===== TRUSTED BY ===== */}
        <section className="relative py-12 lg:py-14">
          <p className="text-center text-[11px] uppercase tracking-[.28em] font-semibold text-mute mb-9">
            Trusted by <span className="text-gold-200">2,300+</span> companies worldwide
          </p>
          <div className="trust-rail mx-auto max-w-6xl py-7">
            <div className="marquee-mask overflow-hidden">
              <div className="logo-marq flex items-center gap-16 w-max">
                {[...TRUST_LOGOS, ...TRUST_LOGOS].map((l, i) => (
                  <span key={i} className="trust-logo" aria-hidden={i >= TRUST_LOGOS.length}>
                    {l.mark}
                    <span className="trust-name">{l.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className="relative py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="reveal text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200">Accessible For Everyone</span>
              <h2 className="mt-5 text-[32px] sm:text-[42px] font-extrabold tracking-tightest leading-[1.08]">Crypto <span className="text-gold-grad">development</span><br />accessible</h2>
            </div>

            <div className="mt-12 grid md:grid-cols-2 gap-5">
              <div className="reveal card rounded-2xl p-6 flex items-center gap-5">
                <span className="icon-tile w-14 h-14 shrink-0"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg></span>
                <div><h3 className="text-[18px] font-bold tracking-tight">Crypto management</h3><p className="mt-1.5 text-[13.5px] leading-[1.6] text-mute">Automated identity verification and anti-money laundering, out of the box.</p></div>
              </div>
              <div className="reveal card rounded-2xl p-6 flex items-center gap-5">
                <span className="icon-tile w-14 h-14 shrink-0"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h13l-3-3M20 15H7l3 3" /></svg></span>
                <div><h3 className="text-[18px] font-bold tracking-tight">Crypto exchange</h3><p className="mt-1.5 text-[13.5px] leading-[1.6] text-mute">A built-in explorer to track every transaction across chains in real time.</p></div>
              </div>
            </div>

            <div className="mt-5 grid sm:grid-cols-3 gap-5">
              <div className="reveal card rounded-2xl p-6">
                <span className="icon-tile w-12 h-12 mb-5"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" /></svg></span>
                <h3 className="text-[17px] font-bold tracking-tight text-gold-grad">Real-time data</h3>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-mute">Global reach with content available across multiple regions and chains.</p>
              </div>
              <div className="reveal card rounded-2xl p-6">
                <span className="icon-tile w-12 h-12 mb-5"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l3-4 3 3 5-7" /></svg></span>
                <h3 className="text-[17px] font-bold tracking-tight text-gold-grad">Advanced trading</h3>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-mute">Visual dashboards for trade performance and live market depth.</p>
              </div>
              <div className="reveal card rounded-2xl p-6">
                <span className="icon-tile w-12 h-12 mb-5"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /><path d="M11 7h4a2 2 0 0 1 2 2v4" /></svg></span>
                <h3 className="text-[17px] font-bold tracking-tight text-gold-grad">Blockchain compliance</h3>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-mute">Exportable reports for tax and accounting purposes, audit-ready.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== MARQUEE ===== */}
        <section className="relative py-6 border-y border-white/[.06] overflow-hidden">
          <div className="marquee-track flex items-center gap-8 w-max text-[40px] sm:text-[58px] font-extrabold tracking-tightest whitespace-nowrap">
            <span>The way you love <span className="text-gold-grad">Tester.io</span> — you will hold</span>
            <span aria-hidden="true">·</span>
            <span>The way you love <span className="text-gold-grad">Tester.io</span> — you will hold</span>
            <span aria-hidden="true">·</span>
          </div>
        </section>

        {/* ===== TOKEN SALE ===== */}
        <section id="token" className="relative py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200"><span className="h-1.5 w-1.5 rounded-full bg-gold-300 animate-pulse" /> Token Sale · Live</span>
              <h2 className="mt-5 text-[32px] sm:text-[44px] font-extrabold tracking-tightest leading-[1.06]">Trading <span className="text-gold-grad">platform</span><br />of the future!</h2>
              <p className="mt-5 max-w-md text-[15px] leading-[1.7] font-medium text-mute">Tester.io brings our love for cryptocurrency into Web3. Like a frog's leap, the chart can jump at any moment. Boom!</p>

              {/* supporting stats — balance the column against the tall sale card */}
              <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-7 max-w-md">
                <div>
                  <dt className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-gold-grad leading-none" data-count="370000" data-suffix="+">370,000+</dt>
                  <dd className="mt-2 text-[13px] leading-[1.5] text-mute">Holders already onboarded across chains.</dd>
                </div>
                <div>
                  <dt className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-gold-grad leading-none">0.00014 <span className="text-[18px] sm:text-[20px] align-top">BTC</span></dt>
                  <dd className="mt-2 text-[13px] leading-[1.5] text-mute">Current TST token price — early in.</dd>
                </div>
              </dl>

              {/* assurance bullets */}
              <ul className="mt-8 space-y-3.5 max-w-md">
                {[
                  "Audited & verified smart contract",
                  "Available on BTC, ETH, SOL & more",
                  "Transparent on-chain vesting schedule",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[14px] font-medium text-white/90">
                    <span className="grid place-items-center h-6 w-6 shrink-0 rounded-full" style={{ background: "linear-gradient(140deg,#F2DDA8,#C6A559)", boxShadow: "0 0 16px -4px rgba(230,185,121,.5)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1308" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-11" /></svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal card rounded-3xl p-7">
              <p className="text-[13px] font-semibold text-mute mb-4">Token sale ends in:</p>
              <div id="countdown" className="grid grid-cols-4 gap-3 mb-6">
                <div className="rounded-xl chip py-3 text-center"><div id="cd-d" className="text-[26px] font-extrabold leading-none text-gold-grad">501</div><div className="mt-1.5 text-[10px] uppercase tracking-wide text-mute">Days</div></div>
                <div className="rounded-xl chip py-3 text-center"><div id="cd-h" className="text-[26px] font-extrabold leading-none text-gold-grad">11</div><div className="mt-1.5 text-[10px] uppercase tracking-wide text-mute">Hour</div></div>
                <div className="rounded-xl chip py-3 text-center"><div id="cd-m" className="text-[26px] font-extrabold leading-none text-gold-grad">06</div><div className="mt-1.5 text-[10px] uppercase tracking-wide text-mute">Minute</div></div>
                <div className="rounded-xl chip py-3 text-center"><div id="cd-s" className="text-[26px] font-extrabold leading-none text-gold-grad">03</div><div className="mt-1.5 text-[10px] uppercase tracking-wide text-mute">Second</div></div>
              </div>
              <p className="text-[18px] font-extrabold mb-4"><span className="text-gold-grad" data-count="49222300" data-prefix="$">$49,222,300</span> <span className="text-[13px] font-medium text-mute">contribution received</span></p>
              <a href="#" data-magnetic className="inline-flex items-center text-[13px] font-bold btn-gold rounded-full px-6 py-3 mb-5">Purchase Now</a>
              <div className="track mb-2" data-progress="46"><i /></div>
              <div className="flex justify-between text-[12px] font-medium text-mute"><span>$5M</span><span>$99M</span></div>
              <div className="mt-4 flex items-center justify-between rounded-lg chip px-3 py-2 text-[11px] font-mono text-mute">
                <span className="truncate">0x217D8d080ac9A755fd29B26889568D</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0"><rect x="9" y="9" width="11" height="11" rx="2" stroke="#E6B979" strokeWidth="1.6" /><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="#E6B979" strokeWidth="1.6" /></svg>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS / CORE ASSET ===== */}
        <section id="how" className="relative py-14 sm:py-20 lg:py-24 border-t border-white/[.06]">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="reveal text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200">How it Works!</span>
              <h2 className="mt-5 text-[32px] sm:text-[42px] font-extrabold tracking-tightest leading-[1.08]">Core asset of the <span className="text-gold-grad">crypto</span><br />marketplace</h2>
            </div>

            <div className="reveal mt-14">
              <ExpandingCards />
            </div>

            <div className="reveal mt-12 card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex items-center gap-4 flex-1">
                <span className="icon-tile w-12 h-12 shrink-0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h13l-3-3M20 15H7l3 3" /></svg></span>
                <div><h3 className="text-[15px] font-bold"><span className="text-gold-grad">Exchange</span> Availability</h3><p className="text-[12.5px] text-mute">Automated identity verification and anti-money laundering.</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid place-items-center h-10 w-10 rounded-full orb-ring text-gold-200 text-[15px] font-bold">₿</span>
                <span className="grid place-items-center h-10 w-10 rounded-full orb-ring text-gold-200 text-[15px] font-bold">Ξ</span>
                <span className="grid place-items-center h-10 w-10 rounded-full orb-ring text-gold-200 text-[15px] font-bold">◎</span>
                <span className="grid place-items-center h-10 w-10 rounded-full orb-ring text-gold-200 text-[15px] font-bold">▲</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== GOODS & ASSETS ===== */}
        <section className="relative py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="reveal text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200">Crypto Direction</span>
              <h2 className="mt-5 text-[32px] sm:text-[42px] font-extrabold tracking-tightest leading-[1.08]">Goods &amp; Assets <span className="text-gold-grad">according</span><br />to users interests.</h2>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-5">
              <div className="reveal card rounded-2xl p-7 text-center flex flex-col items-center">
                <span className="icon-tile w-14 h-14 mb-5"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M9 13h6M9 17h5" /></svg></span>
                <h3 className="text-[16px] font-bold">Read our white paper</h3>
                <p className="mt-2 text-[13px] text-mute flex-1">Everything about the Tester.io token economy in one document.</p>
                <a href="#" className="mt-5 inline-flex items-center text-[12px] font-bold btn-ghost rounded-full px-5 py-2.5">Open Whitepaper</a>
              </div>
              <div className="reveal card rounded-2xl p-7 text-center flex flex-col items-center">
                <span className="icon-tile w-14 h-14 mb-5"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" /></svg></span>
                <h3 className="text-[16px] font-bold">1 TST token price</h3>
                <p className="mt-2 text-[13px] text-mute flex-1">Now at <span className="text-gold-200 font-semibold">0.00014 BTC</span> — early supporters win.</p>
                <a href="#" data-magnetic className="mt-5 inline-flex items-center text-[12px] font-bold btn-gold rounded-full px-5 py-2.5">Buy Tokens</a>
              </div>
              <div className="reveal card rounded-2xl p-7 text-center flex flex-col items-center">
                <span className="icon-tile w-14 h-14 mb-5"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E6B979" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6M21 19a5 5 0 0 0-4-4.9" /></svg></span>
                <h3 className="text-[16px] font-bold">ICO Participants</h3>
                <p className="mt-2 text-[13px] text-mute flex-1"><span className="text-gold-grad font-extrabold text-[20px]" data-count="370000" data-suffix="+">370,000+</span> believers and counting.</p>
                <a href="#" className="mt-5 inline-flex items-center text-[12px] font-bold btn-ghost rounded-full px-5 py-2.5">Join our Telegram</a>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRODUCTS ===== */}
        <section id="products" className="relative py-14 sm:py-20 lg:py-24 border-t border-white/[.06]">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="reveal text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200">Products</span>
              <h2 className="mt-5 text-[32px] sm:text-[42px] font-extrabold tracking-tightest leading-[1.08]">Explore our <span className="text-gold-grad">product</span></h2>
              <p className="mt-4 text-[15px] leading-[1.7] font-medium text-mute">A dedicated product built for leverage trading, real-time monitoring, and on-chain analytics.</p>
            </div>

            <div className="reveal mt-12 card rounded-3xl p-8 sm:p-12 grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
              <div className="pv-stage aspect-[3/2]">
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay muted loop playsInline preload="metadata"
                  poster="/generated/tester-watch-s9.png"
                  aria-label="Tester Pro — smartwatch, dissected"
                >
                  <source src="/Smart%20Watch%20Dissection.mp4" type="video/mp4" />
                </video>
                <div className="pv-grid" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/30" />
                <div className="pv-sheen" aria-hidden="true" />
                <div className="pv-scan" aria-hidden="true" />
                <span className="pv-corner tl" aria-hidden="true" /><span className="pv-corner tr" aria-hidden="true" />
                <span className="pv-corner bl" aria-hidden="true" /><span className="pv-corner br" aria-hidden="true" />
                <span className="pv-live"><i />Pro Series</span>
                <div className="pv-ticker pv-specs" aria-hidden="true">
                  <span>Titanium</span>
                  <span>Sapphire glass</span>
                  <span>38-hr battery</span>
                </div>
              </div>
              <div>
                <h3 className="text-[24px] sm:text-[28px] font-extrabold tracking-tightest">Tester Pro Terminal</h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-mute">The all-in-one terminal for serious traders — live data, advanced dashboards, and audit-ready reporting.</p>
                <p className="mt-4 text-[20px] font-extrabold text-gold-grad">$49 <span className="text-[13px] font-medium text-mute">/ month</span></p>
                <a href="/product.html" data-magnetic className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold btn-gold rounded-full px-6 py-3">
                  View Product
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TESTER TECH ===== */}
        <section id="tester-tech" className="relative py-14 sm:py-20 lg:py-24 border-t border-white/[.06]">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="reveal card rounded-3xl p-8 sm:p-12 grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto overflow-hidden relative">
              <div aria-hidden="true" className="absolute -right-20 -top-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(230,185,121,.14), transparent 65%)", filter: "blur(12px)" }} />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200"><span className="h-1.5 w-1.5 rounded-full bg-gold-300" /> Tester Tech</span>
                <h2 className="mt-5 text-[30px] sm:text-[40px] font-extrabold tracking-tightest leading-[1.06]">The engine behind<br />the <span className="text-gold-grad">leverage</span></h2>
                <p className="mt-4 max-w-md text-[15px] leading-[1.7] font-medium text-mute">Sub-second execution, audited smart contracts, and cross-chain infrastructure — explore the engineering stack that powers Tester.io.</p>
                <a href="/TesterTech.html" onClick={exploreTesterTech} data-magnetic className="mt-7 inline-flex items-center gap-2 text-[13px] font-bold btn-gold rounded-full px-6 py-3">
                  Explore Tester Tech
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              </div>
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { img: "/generated/tester-watch-s9.png", name: "Tester Watch S9", tag: "Wearables", alt: "Tester Watch S9 smartwatch" },
                  { img: "/generated/tester-vision-glasses.png", name: "Tester Vision", tag: "Smart glasses", alt: "Tester Vision smart glasses" },
                  { img: "/generated/tester-voice.png", name: "Tester Voice", tag: "Assistant", alt: "Tester Voice smart speaker" },
                  { img: "/generated/tester-buds.png", name: "Tester Buds Pro", tag: "Audio", alt: "Tester Buds Pro wireless earbuds" },
                ].map((p) => (
                  <a
                    key={p.name}
                    href="/TesterTech.html"
                    onClick={exploreTesterTech}
                    aria-label={`${p.name} — explore Tester Tech`}
                    className="tt-photo group relative block overflow-hidden rounded-2xl border border-white/[.07] bg-[#0B0B0D] transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-1 hover:border-[rgba(230,185,121,.45)] hover:shadow-[0_28px_60px_-40px_rgba(230,185,121,.6)]"
                  >
                    <img
                      src={p.img}
                      alt={p.alt}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = `https://placehold.co/600x450/0B0B0D/E6B979?text=${encodeURIComponent(p.name)}&font=montserrat`; }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 mix-blend-multiply bg-gradient-to-br from-transparent to-[#1a1308]/25" />
                    <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                      <span className="text-[12px] font-bold leading-tight text-[#FBF3DE]">{p.name}</span>
                      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[.16em] text-gold-200">{p.tag}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SIGHTS ===== */}
        <section id="sights" className="relative py-14 sm:py-20 lg:py-24 border-t border-white/[.06] overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 dots opacity-40" />
          <div className="relative mx-auto max-w-6xl px-5 lg:px-8">
            <div className="reveal card rounded-3xl overflow-hidden grid md:grid-cols-2 items-stretch max-w-5xl mx-auto">
              <div className="p-8 sm:p-12 flex flex-col justify-center">
                <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200 w-fit"><span className="h-1.5 w-1.5 rounded-full bg-gold-300" /> Sights · 3D Landmarks</span>
                <h2 className="mt-5 text-[30px] sm:text-[40px] font-extrabold tracking-tightest leading-[1.06]">Watch a wonder<br />rise from a <span className="text-gold-grad">blueprint</span></h2>
                <p className="mt-4 max-w-md text-[15px] leading-[1.7] font-medium text-mute">A scroll-driven experiment: the Petronas Twin Towers built frame by frame, from technical schematic to steel and glass at night. Pure scroll, no video player — just the build.</p>
                <a href="/Sights.html" data-magnetic className="mt-7 inline-flex items-center gap-2 text-[13px] font-bold btn-gold rounded-full px-6 py-3 w-fit">
                  Explore Sights
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              </div>
              <div className="relative min-h-[260px] md:min-h-0 bg-black">
                <img src="/Second%20Frame%20Petronas%20Towers.png" alt="Petronas Twin Towers landmark render" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(14,14,14,1), rgba(14,14,14,.1) 40%, transparent), linear-gradient(0deg, rgba(0,0,0,.5), transparent 50%)" }} />
                <div aria-hidden="true" className="absolute inset-0 mix-blend-multiply" style={{ background: "radial-gradient(60% 60% at 70% 40%, rgba(230,185,121,.18), transparent 70%)" }} />
              </div>
            </div>
          </div>
        </section>

        {/* ===== ROADMAP ===== */}
        <section id="roadmap" className="relative py-14 sm:py-20 lg:py-24 border-t border-white/[.06]">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="reveal text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200">Roadmap</span>
              <h2 className="mt-5 text-[32px] sm:text-[42px] font-extrabold tracking-tightest leading-[1.08]">Our <span className="text-gold-grad">strategy</span> &amp; Planning</h2>
            </div>

            <div className="relative mt-16 grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-10">
              {/* base rail + completed-progress overlay (through the "In progress" node) */}
              <div aria-hidden="true" className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-white/10" />
              <div aria-hidden="true" className="hidden lg:block absolute top-7 left-[12.5%] w-[50%] h-px" style={{ background: "linear-gradient(90deg,rgba(230,185,121,.85),rgba(230,185,121,.85) 70%,transparent)", boxShadow: "0 0 12px rgba(230,185,121,.55)" }} />
              {ROADMAP.map((m, i) => (
                <div key={m.year} className="reveal text-center">
                  <div className={`relative mx-auto rm-node w-14 h-14 mb-5${m.done ? " done" : ""}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={m.done ? "#1A1308" : "#E6B979"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{m.icon}</svg>
                  </div>
                  <div className="text-[11px] uppercase tracking-[.22em] font-semibold text-mute/80 mb-1.5">Phase {String(i + 1).padStart(2, "0")}</div>
                  <div className="text-[22px] font-extrabold text-gold-grad leading-none">{m.year}</div>
                  <p className="mt-2.5 text-[13px] leading-[1.5] text-mute max-w-[180px] mx-auto">{m.desc}</p>
                  <span className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold ${m.done ? "text-gold-200" : "text-mute/70"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${m.done ? "bg-gold-300" : "bg-white/30"}`} />{m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="relative py-24 overflow-hidden border-t border-white/[.06]">
          <div aria-hidden="true" className="absolute inset-0 dots opacity-60" />
          <div className="relative mx-auto max-w-3xl px-5 text-center">
            <div className="reveal flex flex-col items-center">
              <a href="#top" className="flex items-center gap-2.5" aria-label="Tester.io home"><Logo size={30} /><span className="text-[18px] font-extrabold tracking-tight">Tester<span className="text-gold-grad">.io</span></span></a>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full pill px-3.5 py-1.5 text-[12px] font-semibold text-gold-200">Built on Web3. Powered by You</span>
              <h2 className="mt-6 text-[34px] sm:text-[48px] font-extrabold tracking-tightest leading-[1.06]">Join with our <span className="text-gold-grad">future</span><br />of Tester.io currency</h2>
              <div className="mt-6 flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gold-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold-300/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold-300/30" />
              </div>
              <div className="mt-10 relative w-40 h-40 floaty">
                <div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 50% 40%, rgba(230,185,121,.4), transparent 62%)", filter: "blur(10px)" }} />
                <div className="emblem relative w-40 h-40"><Logo size={62} /></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="relative border-t border-white/[.06] overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(230,185,121,.5),transparent)" }} />
        <div aria-hidden="true" className="absolute inset-0 dots opacity-40" />

        <div className="relative mx-auto max-w-7xl 2xl:max-w-[92rem] px-5 lg:px-8 2xl:px-12 pt-16 pb-8">
          <div className="reveal flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-12 border-b border-white/[.06]">
            <div>
              <h3 className="text-[24px] sm:text-[28px] font-extrabold tracking-tightest leading-tight">Stay ahead of the <span className="text-gold-grad">curve</span></h3>
              <p className="mt-2 text-[14px] text-mute max-w-md">Get token updates, roadmap drops, and early-access invites — straight to your inbox.</p>
            </div>
            <form className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full lg:w-auto" onSubmit={(e) => e.preventDefault()}>
              <div className="flex items-center gap-2.5 flex-1 lg:w-72 rounded-full chip px-4 py-3">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="#8A8A8F" strokeWidth="1.6" /><path d="m4 7 8 6 8-6" stroke="#8A8A8F" strokeWidth="1.6" /></svg>
                <input type="email" placeholder="Your email" className="bg-transparent w-full text-[14px] text-white placeholder:text-mute outline-none" />
              </div>
              <button type="submit" data-magnetic className="inline-flex items-center justify-center gap-2 text-[13px] font-bold btn-gold rounded-full px-6 py-3 whitespace-nowrap">Subscribe</button>
            </form>
          </div>

          <div className="reveal grid grid-cols-2 md:grid-cols-6 gap-10 py-14">
            <div className="col-span-2 md:col-span-2">
              <a href="#top" className="flex items-center gap-2.5" aria-label="Tester.io home"><Logo size={30} /><span className="text-[18px] font-extrabold tracking-tight">Tester<span className="text-gold-grad">.io</span></span></a>
              <p className="mt-5 max-w-xs text-[14px] leading-[1.7] text-mute">The future of leverage — built on Web3, powered by you. Trade, monitor, and hold the tokens you love.</p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full pill px-3 py-1.5 text-[11px] font-semibold text-gold-200"><span className="h-1.5 w-1.5 rounded-full bg-gold-300" /> Built on Web3. Powered by You</span>
              <div className="mt-6 flex gap-2.5">
                <a href="#" aria-label="X / Twitter" className="grid place-items-center h-9 w-9 rounded-full chip text-mute hover:text-gold-200 hover:border-gold-400 transition-colors duration-300"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h3l-7 8 8 12h-6l-5-7-6 7H2l8-9L2 2h6l4 6 6-6z" /></svg></a>
                <a href="#" aria-label="Telegram" className="grid place-items-center h-9 w-9 rounded-full chip text-mute hover:text-gold-200 hover:border-gold-400 transition-colors duration-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 2.7 11.7c-1 .4-1 1.7.1 2l4.8 1.5 1.8 5.8c.3.8 1.2 1 1.8.4l2.6-2.5 4.7 3.5c.7.5 1.6.1 1.8-.7l3-15.4c.2-1-.7-1.8-1.4-1.5zM9.7 14.3l8.2-5-6.7 6.2-.2 3.1z" /></svg></a>
                <a href="#" aria-label="Discord" className="grid place-items-center h-9 w-9 rounded-full chip text-mute hover:text-gold-200 hover:border-gold-400 transition-colors duration-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5a16 16 0 0 0-4-1.2l-.2.5a13 13 0 0 1 3.5 1.2 12 12 0 0 0-10.5 0A13 13 0 0 1 11.2 4.3L11 3.8A16 16 0 0 0 7 5C4.2 9 3.6 13 3.8 17a16 16 0 0 0 4.8 2.4l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11 11 0 0 0 9.3 0l.4.3a10 10 0 0 1-1.7.8l1 1.6A16 16 0 0 0 22.2 17c.3-4.7-.6-8.6-3.2-12zM9.5 14.5c-.8 0-1.4-.7-1.4-1.6s.6-1.7 1.4-1.7 1.5.8 1.4 1.7c0 .9-.6 1.6-1.4 1.6zm5 0c-.8 0-1.4-.7-1.4-1.6s.6-1.7 1.4-1.7 1.5.8 1.4 1.7c0 .9-.6 1.6-1.4 1.6z" /></svg></a>
                <a href="#" aria-label="GitHub" className="grid place-items-center h-9 w-9 rounded-full chip text-mute hover:text-gold-200 hover:border-gold-400 transition-colors duration-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.8-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z" /></svg></a>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[.16em] text-white">Product</h4>
              <ul className="mt-5 space-y-3 text-[14px] font-medium text-mute">
                <li><a href="#features" className="hover:text-gold-200 transition-colors duration-300">Features</a></li>
                <li><a href="#token" className="hover:text-gold-200 transition-colors duration-300">Token</a></li>
                <li><a href="#how" className="hover:text-gold-200 transition-colors duration-300">How it works</a></li>
                <li><a href="#roadmap" className="hover:text-gold-200 transition-colors duration-300">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[.16em] text-white">Company</h4>
              <ul className="mt-5 space-y-3 text-[14px] font-medium text-mute">
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">About</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Careers</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Blog</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Press kit</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[.16em] text-white">Resources</h4>
              <ul className="mt-5 space-y-3 text-[14px] font-medium text-mute">
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Whitepaper</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Docs</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Token metrics</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[.16em] text-white">Legal</h4>
              <ul className="mt-5 space-y-3 text-[14px] font-medium text-mute">
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Privacy</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Terms</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Cookies</a></li>
                <li><a href="#" className="hover:text-gold-200 transition-colors duration-300">Disclosures</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[.06] text-[13px] font-medium text-mute/70">
            <p>© 2026 Tester.io. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-400/80" /> All systems operational</span>
              <a href="#top" className="inline-flex items-center gap-1.5 hover:text-gold-200 transition-colors duration-300">Back to top
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="relative select-none px-4 -mb-2" aria-hidden="true">
          <div data-parallax="6" className="text-center font-extrabold tracking-tightest leading-none text-transparent bg-clip-text" style={{ fontSize: "min(19vw,250px)", backgroundImage: "linear-gradient(180deg,rgba(230,185,121,.5),rgba(198,165,89,.04))" }}>
            Tester.io
          </div>
        </div>
      </footer>

      {/* ===== FLOATING CHAT WIDGET (guided chat → /api/contact) ===== */}
      <ChatWidget />

      {/* ===== PAGE-WIPE TRANSITION (→ Tester Tech) ===== */}
      <div className={`page-wipe${leaving ? " active" : ""}`} aria-hidden={!leaving}>
        <div className="page-wipe-inner">
          <img className="pw-logo" src="/tester-logo.png" alt="" aria-hidden="true" />
          <div className="pw-title">Tester <span className="accent">Tech</span></div>
          <div className="pw-sub">Smart devices, beautifully connected</div>
          <div className="pw-bar"><i /></div>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <AuthModal
        open={authMode !== null}
        mode={authMode ?? "login"}
        onClose={() => setAuthMode(null)}
        onSwitch={(m) => setAuthMode(m)}
      />
    </>
  );
}
