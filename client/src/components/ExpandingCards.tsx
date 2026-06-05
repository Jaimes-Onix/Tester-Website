import { useEffect, useMemo, useState, type ReactNode } from "react";

interface Item {
  title: string;
  desc: string;
  icon: ReactNode;
  photo: string;
  cx: number;
  cy: number;
}

// Self-contained gold-glow gradient used as the load-failure fallback (never broken / never plain).
function grad(cx: number, cy: number) {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'><rect width='600' height='800' fill='#0b0b0b'/><defs><radialGradient id='g' cx='${cx}' cy='${cy}' r='520' gradientUnits='userSpaceOnUse'><stop offset='0' stop-color='#E6B979' stop-opacity='.55'/><stop offset='.55' stop-color='#C6A559' stop-opacity='.13'/><stop offset='1' stop-color='#0b0b0b' stop-opacity='0'/></radialGradient></defs><rect width='600' height='800' fill='url(#g)'/></svg>`
    )
  );
}

const ICON = "#E6B979";
const items: Item[] = [
  {
    title: "Currency conversion",
    desc: "Exportable reports for tax and accounting purposes.",
    cx: 180, cy: 200,
    photo: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=900&q=70",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h13l-3-3M20 15H7l3 3" /></svg>,
  },
  {
    title: "Data Encryption",
    desc: "Visual dashboards for trade performance and security.",
    cx: 440, cy: 240,
    photo: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=70",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  },
  {
    title: "Cold wallet storage",
    desc: "Regular updates on crypto trends and platform features.",
    cx: 300, cy: 480,
    photo: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=900&q=70",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10M2 12h20" /></svg>,
  },
  {
    title: "Transfer crypto & data",
    desc: "Guides for beginners on crypto basics and trading.",
    cx: 160, cy: 560,
    photo: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=900&q=70",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h13M11 6l6 6-6 6" /><path d="M21 4v16" /></svg>,
  },
  {
    title: "Smart contracts",
    desc: "Automated, audited execution with zero counterparty risk.",
    cx: 470, cy: 520,
    photo: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=900&q=70",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10.5 13 9 14.5l1.5 1.5M13.5 13 15 14.5 13.5 16" /></svg>,
  },
  {
    title: "Staking rewards",
    desc: "Earn passive yield on the assets you already hold.",
    cx: 300, cy: 260,
    photo: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=70",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>,
  },
];

export default function ExpandingCards() {
  const [active, setActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const gridStyle = useMemo(() => {
    const tpl = items.map((_, i) => (i === active ? "5fr" : "1fr")).join(" ");
    return isDesktop
      ? { gridTemplateRows: "1fr", gridTemplateColumns: tpl }
      : { gridTemplateColumns: "1fr", gridTemplateRows: tpl };
  }, [active, isDesktop]);

  return (
    <ul className="exp-cards" style={gridStyle}>
      {items.map((it, i) => (
        <li
          key={it.title}
          className={"exp-card" + (i === active ? " active" : "")}
          tabIndex={0}
          onMouseEnter={() => setActive(i)}
          onFocus={() => setActive(i)}
          onClick={() => setActive(i)}
        >
          <img
            src={it.photo}
            alt={it.title}
            onError={(e) => {
              const img = e.currentTarget;
              const fb = grad(it.cx, it.cy);
              if (img.getAttribute("src") !== fb) img.src = fb;
            }}
          />
          <div className="exp-ov" />
          <div className="exp-vtitle">{it.title}</div>
          <div className="exp-content">
            <span className="exp-icon exp-rc" style={{ transitionDelay: ".05s" }}>{it.icon}</span>
            <h3 className="exp-h exp-rc" style={{ transitionDelay: ".1s" }}>{it.title}</h3>
            <p className="exp-p exp-rc" style={{ transitionDelay: ".15s" }}>{it.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
