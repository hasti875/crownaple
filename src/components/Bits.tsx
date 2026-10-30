import type { ReactNode } from "react";

/** Full Crownaple logo: crowned pineapple, green leaves, wordmark + tagline */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Crownaple — Crowning Brands Online"
      className={`aspect-square rounded-full object-cover ${className}`}
      draggable={false}
    />
  );
}

/** Small crown icon used for the cursor */
export function CrownIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 18" className={className} aria-hidden>
      <path d="M2 16 L1 4 L7 9 L12 1 L17 9 L23 4 L22 16 Z" fill="#f5a623" stroke="#ffcf70" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

/** Split a heading into masked letters for rise-in reveals */
export function Split({ text, className = "", as = "h2" }: { text: string; className?: string; as?: "h1" | "h2" | "h3" }) {
  const Tag = as;
  return (
    <Tag className={`split ${className}`} aria-label={text}>
      {text.split(" ").map((w, wi) => (
        <span key={wi} className="inline-block overflow-hidden align-bottom pb-[0.06em] mr-[0.22em]" aria-hidden>
          {w.split("").map((c, ci) => (
            <span key={ci} className="ch inline-block">{c}</span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="reveal mb-4 text-xs font-semibold tracking-[0.35em] text-[#f5a623] uppercase">{children}</p>;
}
