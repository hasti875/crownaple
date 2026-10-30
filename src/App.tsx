import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ParticleScene, hasWebGL, type Keyframe } from "./particles/ParticleScene";
import { SECTION_SHAPES, NAV, PLATFORMS, SOLUTIONS, SERVICES, TEAM, PROCESS, EMAIL, PHONE, WHATSAPP, INSTAGRAM, INSTAGRAM_HANDLE, ADDRESS } from "./content";
import { LogoMark, CrownIcon, Split, Eyebrow } from "./components/Bits";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [pct, setPct] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [webgl] = useState(() => hasWebGL());
  const [platform, setPlatform] = useState(0);
  const [sound, setSound] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {});
    let scene: ParticleScene | null = null;

    // ---- smooth scroll ----
    let lenis: Lenis | null = null;
    const tick = (t: number) => lenis?.raf(t * 1000);
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.09 });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenis.stop(); // locked during loader
    }

    // ---- particles ----
    if (webgl && canvasRef.current) {
      try { scene = new ParticleScene(canvasRef.current, reduced); } catch { scene = null; }
    }

    /** Build scroll keyframes from section positions */
    const buildKeyframes = () => {
      if (!scene) return;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const kf: Keyframe[] = [];
      Object.entries(SECTION_SHAPES).forEach(([id, shapes]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.offsetTop, h = el.offsetHeight;
        shapes.forEach((cfg, i) => {
          let y = top + ((i + 0.5) * h) / shapes.length - vh / 2;
          if (id === "hero") y = 0;
          if (id === "contact") y = max;
          kf.push({ ...cfg, y: Math.max(0, Math.min(max, y)) });
        });
      });
      kf.sort((a, b) => a.y - b.y);
      scene.setKeyframes(kf);
    };
    ScrollTrigger.addEventListener("refresh", buildKeyframes);

    ctx.add(() => {
      // ---- loader: count up while particles assemble ----
      const state = { v: 0 };
      gsap.to(state, {
        v: 1, duration: reduced ? 0.6 : 2.6, ease: "power2.inOut",
        onUpdate: () => { setPct(Math.round(state.v * 100)); if (scene) scene.assemble = state.v; },
        onComplete: () => {
          setLoaded(true);
          lenis?.start();
          if (!reduced) gsap.from("#hero .ch", { yPercent: 115, stagger: 0.03, duration: 1, ease: "power4.out" });
          gsap.from("#hero .reveal", { y: 30, opacity: 0, stagger: 0.12, duration: 1, delay: 0.3 });
        },
      });

      // progress bar
      gsap.to(".progress", { scaleY: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });

      if (!reduced) {
        gsap.utils.toArray<HTMLElement>("section:not(#hero) .split").forEach((el) => {
          gsap.from(el.querySelectorAll(".ch"), {
            yPercent: 115, stagger: 0.025, duration: 0.9, ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });
        gsap.utils.toArray<HTMLElement>("section:not(#hero) .reveal").forEach((el) => {
          gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
        });
        // giant outlined "Area of expertise" slides across
        gsap.fromTo(".slide-x", { xPercent: 10 }, { xPercent: -45, ease: "none", scrollTrigger: { trigger: "#expertise", start: "top bottom", end: "bottom top", scrub: true } });
        // team names slide horizontally (alternating direction)
        gsap.utils.toArray<HTMLElement>(".team-name").forEach((el, i) => {
          gsap.fromTo(el, { xPercent: i % 2 ? -25 : 15 }, { xPercent: i % 2 ? 5 : -15, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });
      }
      // process line draws itself
      gsap.fromTo(".process-line", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: "#process", start: "top 70%", end: "bottom 70%", scrub: true } });
      gsap.fromTo(".process-line-v", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#process", start: "top 70%", end: "bottom 70%", scrub: true } });

      // active platform
      ScrollTrigger.create({
        trigger: "#platforms", start: "top top", end: "bottom bottom",
        onUpdate: (s) => setPlatform(Math.min(PLATFORMS.length - 1, Math.floor(s.progress * PLATFORMS.length))),
      });
    });

    ScrollTrigger.refresh();
    buildKeyframes();

    // ---- custom cursor ----
    const cur = cursorRef.current;
    const fine = window.matchMedia("(pointer: fine)").matches;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let onOver: ((e: Event) => void) | null = null;
    if (cur && fine) {
      const xTo = gsap.quickTo(cur, "x", { duration: 0.25, ease: "power3" });
      const yTo = gsap.quickTo(cur, "y", { duration: 0.25, ease: "power3" });
      onMove = (e) => { xTo(e.clientX); yTo(e.clientY); };
      onOver = (e) => {
        const hit = (e.target as HTMLElement).closest("a,button");
        cur.classList.toggle("is-hover", !!hit);
      };
      window.addEventListener("pointermove", onMove);
      document.addEventListener("pointerover", onOver);
    }

    return () => {
      ctx.revert();
      ScrollTrigger.removeEventListener("refresh", buildKeyframes);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      scene?.dispose();
      if (onMove) window.removeEventListener("pointermove", onMove);
      if (onOver) document.removeEventListener("pointerover", onOver);
    };
  }, [webgl]);

  useEffect(() => {
    const el = new Audio();
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    audioRef.current = el;

    let blobUrl = "";
    fetch("/audio/ambient.mp3")
      .then((r) => r.blob())
      .then((blob) => {
        blobUrl = URL.createObjectURL(blob);
        el.src = blobUrl;
        el.load();
      })
      .catch(() => {
        el.src = "/audio/ambient.mp3";
        el.load();
      });

    return () => {
      if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
      el.pause();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, []);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (lenisRef.current) lenisRef.current.scrollTo(href, { duration: 1.6 });
    else document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  /** looping ambient music (CC0) — fades with the nav toggle */
  const toggleSound = () => {
    const el = audioRef.current;
    if (!el) return;
    const turningOn = !sound;
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);

    if (turningOn) {
      if (!el.src) {
        el.src = "/audio/ambient.mp3";
        el.load();
      }
      el.volume = 0.22;
      const play = () => el.play().catch(() => {});
      play();
      if (el.readyState < 2) el.addEventListener("canplay", play, { once: true });
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 180);
        el.volume = 0.22 + 0.13 * t;
        if (t < 1) fadeRef.current = requestAnimationFrame(tick);
        else fadeRef.current = null;
      };
      fadeRef.current = requestAnimationFrame(tick);
    } else {
      const start = performance.now();
      const from = el.volume;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 220);
        el.volume = from * (1 - t);
        if (t < 1) fadeRef.current = requestAnimationFrame(tick);
        else {
          el.pause();
          fadeRef.current = null;
        }
      };
      fadeRef.current = requestAnimationFrame(tick);
    }
    setSound(turningOn);
  };

  return (
    <div className="relative text-[#fff6e5]">
      {/* Fixed WebGL canvas, or static fallback */}
      {webgl ? (
        <canvas ref={canvasRef} className="fixed inset-0 h-screen w-screen" aria-hidden />
      ) : (
        <div className="fixed inset-0 flex items-center justify-end pr-[8vw]" aria-hidden>
          <div className="fallback-glow"><LogoMark className="h-[50vh] w-[50vh] opacity-80" /></div>
        </div>
      )}
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />
      <div className="fixed left-0 top-0 z-50 h-screen w-[3px] bg-white/5"><div className="progress h-full w-full origin-top scale-y-0 bg-gradient-to-b from-[#ffcf70] to-[#f5a623]" /></div>
      <div ref={cursorRef} className="cursor" aria-hidden><CrownIcon className="h-full w-full" /></div>

      {/* Loader */}
      <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-end pb-[12vh] transition-opacity duration-1000 ${loaded ? "pointer-events-none opacity-0" : "opacity-100"}`} style={{ background: webgl ? "transparent" : "#0d0805" }}>
        <LogoMark className="mb-4 h-28 w-28 drop-shadow-[0_0_28px_rgba(245,166,35,0.55)]" />
        <p className="font-display mt-2 text-7xl text-[#f5a623] tabular-nums">{pct}%</p>
      </div>

      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 md:px-12">
        <a href="#hero" onClick={go("#hero")} className="block" aria-label="Crownaple home">
          <LogoMark className="h-14 w-14 md:h-16 md:w-16" />
        </a>
        <nav className="flex items-center gap-5 text-sm md:gap-8">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} onClick={go(n.href)} className="link-u hidden text-[#fff6e5]/80 hover:text-[#ffcf70] sm:inline">{n.label}</a>
          ))}
          <button
            onClick={toggleSound}
            aria-pressed={sound}
            className={`rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase transition-colors duration-300 ${
              sound
                ? "bg-[#f5a623] text-[#0d0805] shadow-[0_0_24px_-6px_#f5a623]"
                : "border border-[#ffcf70]/45 text-[#ffcf70] hover:bg-[#f5a623]/12"
            }`}
          >
            Sound {sound ? "on" : "off"}
          </button>
        </nav>
      </header>

      <main className="relative z-10">
        {/* 1. HERO */}
        <section id="hero" className="flex min-h-screen items-center px-6 md:px-12">
          <div className="max-w-2xl pt-20">
            <Eyebrow>Crowning Brands Online</Eyebrow>
            <Split as="h1" text="CROWN YOUR BRAND" className="font-display text-[18vw] leading-[0.88] md:text-[9.5vw]" />
            <p className="reveal mt-6 max-w-md text-lg text-[#fff6e5]/75">We turn social presence into a kingdom. Strategy, content and growth for brands that want to rule online.</p>
            <div className="reveal mt-9 flex flex-wrap gap-4">
              <a href="#contact" onClick={go("#contact")} className="btn-primary">Let's talk</a>
              <a href="#platforms" onClick={go("#platforms")} className="btn-ghost">See our work</a>
            </div>
          </div>
        </section>

        {/* 2. AGENCY */}
        <section id="agency" className="flex min-h-[130vh] items-center justify-end px-6 md:px-12">
          <div className="max-w-xl">
            <Eyebrow>01 / Who we are</Eyebrow>
            <Split text="THE AGENCY" className="font-display text-7xl md:text-9xl" />
            <p className="reveal mt-6 text-2xl leading-snug text-[#fff6e5]/85 md:text-3xl">We believe the power of <em className="text-[#ffcf70] not-italic">creativity</em>, <em className="text-[#ffcf70] not-italic">design</em> and <em className="text-[#ffcf70] not-italic">emotion</em> is the key to aligning brands with their audience's unique world.</p>
          </div>
        </section>

        {/* 3. PLATFORMS (tall, sticky) */}
        <section id="platforms" className="relative h-[480vh]">
          <div className="sticky top-0 flex h-screen items-center px-6 md:px-12">
            <div className="max-w-xl">
              <Eyebrow>02 / Platforms</Eyebrow>
              <Split text="EVERYWHERE YOUR CUSTOMERS ARE" className="font-display text-6xl leading-[0.9] md:text-8xl" />
              <ul className="mt-8 space-y-3">
                {PLATFORMS.map((p, i) => (
                  <li key={p.name} className={`flex gap-4 border-l-2 pl-4 transition-all duration-500 ${i === platform ? "border-[#f5a623] opacity-100" : "border-white/10 opacity-35"}`}>
                    <span className="font-display w-28 shrink-0 text-2xl text-[#ffcf70]">{p.name}</span>
                    <span className={`text-sm text-[#fff6e5]/80 transition-all duration-500 md:text-base ${i === platform ? "max-h-20" : "max-h-6 overflow-hidden"}`}>{p.line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 4. SOLUTIONS */}
        <section id="solutions" className="flex min-h-[140vh] items-center px-6 md:px-12">
          <div className="max-w-xl">
            <Eyebrow>03 / What we do</Eyebrow>
            <Split text="SOLUTIONS" className="font-display text-7xl md:text-9xl" />
            <div className="mt-8 space-y-8">
              {SOLUTIONS.map((s, i) => (
                <div key={s.t} className="reveal flex gap-6 border-t border-[#f5a623]/20 pt-6">
                  <span className="font-display text-xl text-[#f5a623]">0{i + 1}</span>
                  <div><h3 className="font-display text-3xl">{s.t}</h3><p className="mt-1 text-[#fff6e5]/70">{s.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. SERVICES */}
        <section id="expertise" className="relative min-h-[180vh] overflow-hidden px-6 py-32 md:px-12">
          <div className="slide-x outline-text font-display pointer-events-none absolute top-24 whitespace-nowrap text-[22vw] leading-none opacity-40">Services · Services</div>
          <Eyebrow>04 / Services</Eyebrow>
          <Split text="SERVICES" className="font-display text-7xl md:text-9xl" />
          <div className="relative mt-12 max-w-3xl space-y-5">
            {SERVICES.map((s, i) => (
              <article key={s.t} className="reveal rounded-2xl border border-[#f5a623]/35 bg-[#0d0805]/55 p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5a623] text-lg text-[#0d0805]">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-3xl text-[#ffcf70] md:text-4xl">{s.t}</h3>
                    <p className="mt-2 text-[#fff6e5]/75">{s.d}</p>
                    <ul className={`mt-5 grid gap-x-8 gap-y-2.5 text-sm text-[#fff6e5]/80 ${s.items.length > 3 ? "md:grid-cols-2" : ""}`}>
                      {s.items.map((it) => (
                        <li key={it.k} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f5a623]" />
                          <span><strong className="font-semibold text-[#fff6e5]">{it.k}</strong> — {it.v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 6. TEAM */}
        <section id="team" className="relative min-h-[140vh] px-6 py-32 md:px-12">
          <Eyebrow>05 / People</Eyebrow>
          <Split text="OUR SMART TEAM" className="font-display text-6xl md:text-8xl" />
          <div className="mt-16 max-w-3xl space-y-10">
            {TEAM.map((m) => (
              <div key={m.name} className="reveal flex items-center gap-6 border-t border-[#f5a623]/20 pt-8 md:gap-8">
                <img
                  src={m.photo}
                  alt={m.name}
                  className="h-28 w-28 shrink-0 rounded-full border-[3px] border-[#f5a623] object-cover md:h-36 md:w-36"
                />
                <div className="min-w-0">
                  <h3 className="font-display text-4xl leading-none md:text-5xl">{m.name}</h3>
                  <p className="mt-3 text-xs font-semibold tracking-[0.22em] text-[#f5a623] uppercase">{m.role}</p>
                  <p className="mt-2 text-sm text-[#fff6e5]/70">Education: {m.education}</p>
                  <p className="text-sm text-[#fff6e5]/70">Age: {m.age}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. PROCESS */}
        <section id="process" className="relative px-6 py-40 md:px-12">
          <Eyebrow>06 / How we work</Eyebrow>
          <Split text="HOW WE WORK" className="font-display text-6xl md:text-8xl" />
          <div className="relative mt-16 overflow-x-auto pb-4">
            <div className="process-line absolute left-0 right-0 top-[19px] h-px origin-left bg-[#f5a623]" />
            <div className="relative grid min-w-[920px] grid-cols-5 gap-6 md:min-w-0 md:gap-8">
              {PROCESS.map((p, i) => (
                <div key={p.t} className="reveal relative pt-14">
                  <span className="absolute left-0 top-0 z-10 font-display flex h-10 w-10 items-center justify-center rounded-full bg-[#f5a623] text-lg text-[#0d0805]">{i + 1}</span>
                  <h3 className="font-display text-2xl md:text-3xl">{p.t}</h3>
                  <p className="mt-2 text-sm text-[#fff6e5]/70 md:text-base">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. CONTACT / FOOTER */}
        <section id="contact" className="flex min-h-screen flex-col justify-end px-6 pb-10 pt-40 md:px-12">
          <Eyebrow>Got a brand to crown?</Eyebrow>
          <a href={`mailto:${EMAIL}`} className="email-link self-start text-[9vw] font-extralight leading-none tracking-tight md:text-[7vw]">{EMAIL}</a>
          <div className="mt-20 h-px w-full bg-[#f5a623]/30" />
          <div className="mt-10 grid gap-10 text-sm sm:grid-cols-3">
            <div>
              <h4 className="font-display mb-3 text-xl text-[#ffcf70]">Links</h4>
              <ul className="space-y-2 text-[#fff6e5]/70">{NAV.map((n) => <li key={n.label}><a href={n.href} onClick={go(n.href)} className="link-u">{n.label}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="font-display mb-3 text-xl text-[#ffcf70]">Contact</h4>
              <ul className="space-y-2 text-[#fff6e5]/70">
                <li><a href={`tel:+91${PHONE}`} className="link-u">Phone / WhatsApp: {PHONE}</a></li>
                <li><a href={WHATSAPP} target="_blank" rel="noreferrer" className="link-u">Chat on WhatsApp ↗</a></li>
                <li><a href={`mailto:${EMAIL}`} className="link-u">{EMAIL}</a></li>
                <li><a href={INSTAGRAM} target="_blank" rel="noreferrer" className="link-u">Instagram: {INSTAGRAM_HANDLE}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display mb-3 text-xl text-[#ffcf70]">Location</h4>
              <p className="text-[#fff6e5]/70">{ADDRESS[0]}<br />{ADDRESS[1]}</p>
            </div>
          </div>
          <div className="mt-16 flex flex-col justify-between gap-2 text-xs text-[#fff6e5]/50 sm:flex-row">
            <p className="font-logo text-base text-[#fff6e5]/80">Crowning Brands Online. <span className="text-[#f5a623]">★</span></p>
            <p>© {new Date().getFullYear()} Crownaple. All rights reserved.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
