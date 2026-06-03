import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

/**
 * Runs all the imperative site behaviour once after mount:
 * 5s shader intro, GSAP scroll reveals / parallax / count-up / magnetic,
 * the live token countdown, and the Three.js hero object.
 * Mirrors the original vanilla "motion engine".
 */
export function useSiteEffects() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = !root.classList.contains("anim"); // .anim set in index.html only when motion is OK
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const cleanups: Array<() => void> = [];

    /* ---------- live countdown (always runs) ---------- */
    const cd = {
      d: document.getElementById("cd-d"),
      h: document.getElementById("cd-h"),
      m: document.getElementById("cd-m"),
      s: document.getElementById("cd-s"),
    };
    if (cd.d) {
      const target = new Date("2027-06-01T00:00:00Z").getTime();
      const pad = (n: number) => (n < 10 ? "0" : "") + n;
      const tick = () => {
        const sec = Math.max(0, Math.floor((target - Date.now()) / 1000));
        cd.d!.textContent = String(Math.floor(sec / 86400));
        cd.h!.textContent = pad(Math.floor((sec % 86400) / 3600));
        cd.m!.textContent = pad(Math.floor((sec % 3600) / 60));
        cd.s!.textContent = pad(sec % 60);
      };
      tick();
      const id = window.setInterval(tick, 1000);
      cleanups.push(() => clearInterval(id));
    }

    /* ---------- GSAP scroll choreography ---------- */
    if (!reduce) {
      ScrollTrigger.config({ ignoreMobileResize: true });

      gsap.set(".reveal", { opacity: 0, y: 28 });
      ScrollTrigger.batch(".reveal", {
        start: "top 90%",
        onEnter: (els) =>
          gsap.to(els, {
            opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.09, overwrite: true,
            onStart: () => els.forEach((e) => ((e as HTMLElement).style.willChange = "transform,opacity")),
            onComplete: () => els.forEach((e) => ((e as HTMLElement).style.willChange = "auto")),
          }),
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const depth = parseFloat(el.getAttribute("data-parallax") || "10") || 10;
        gsap.to(el, {
          yPercent: -depth, ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const targetVal = parseFloat(el.getAttribute("data-count") || "0") || 0;
        const pre = el.getAttribute("data-prefix") || "";
        const suf = el.getAttribute("data-suffix") || "";
        const o = { v: 0 };
        el.textContent = pre + "0" + suf;
        gsap.to(o, {
          v: targetVal, duration: 1.6, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => (el.textContent = pre + Math.round(o.v).toLocaleString("en-US") + suf),
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-progress]").forEach((bar) => {
        const pct = parseFloat(bar.getAttribute("data-progress") || "0") || 0;
        const fill = bar.querySelector("i") as HTMLElement | null;
        ScrollTrigger.create({
          trigger: bar, start: "top 92%", once: true,
          onEnter: () => { if (fill) fill.style.width = pct + "%"; },
        });
      });

      if (!isMobile && (gsap as any).quickTo) {
        const strength = 0.4;
        document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
          const xTo = (gsap as any).quickTo(btn, "x", { duration: 0.45, ease: "power3.out" });
          const yTo = (gsap as any).quickTo(btn, "y", { duration: 0.45, ease: "power3.out" });
          const move = (e: MouseEvent) => {
            const r = btn.getBoundingClientRect();
            xTo((e.clientX - r.left - r.width / 2) * strength);
            yTo((e.clientY - r.top - r.height / 2) * strength);
          };
          const leave = () => { xTo(0); yTo(0); };
          btn.addEventListener("mousemove", move);
          btn.addEventListener("mouseleave", leave);
          cleanups.push(() => { btn.removeEventListener("mousemove", move); btn.removeEventListener("mouseleave", leave); });
        });
      }

      ScrollTrigger.refresh();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      cleanups.push(() => window.removeEventListener("load", onLoad));
    }

    /* ---------- 5-second shader intro ---------- */
    const loader = document.getElementById("loader");
    const INTRO_MS = 5000;
    let introTeardown: (() => void) | null = null;
    const endIntro = () => {
      if (!loader || loader.classList.contains("done")) return;
      loader.classList.add("done");
      root.classList.remove("intro");
      ScrollTrigger.refresh();
      window.setTimeout(() => { if (introTeardown) introTeardown(); }, 1000);
    };

    if (reduce) {
      if (loader) loader.style.display = "none";
      root.classList.remove("intro");
    } else {
      const barFill = loader?.querySelector(".intro-bar > i") as HTMLElement | null;
      if (barFill) { barFill.style.transition = `width ${INTRO_MS - 400}ms linear`; requestAnimationFrame(() => (barFill.style.width = "100%")); }
      introTeardown = startIntroShader();
      const t1 = window.setTimeout(endIntro, INTRO_MS);
      const t2 = window.setTimeout(endIntro, INTRO_MS + 2500);
      cleanups.push(() => { clearTimeout(t1); clearTimeout(t2); });
    }

    /* ---------- Three.js hero object ---------- */
    if (!reduce && !isMobile) {
      const teardown = startHero();
      if (teardown) cleanups.push(teardown);
    }

    return () => { cleanups.forEach((fn) => fn()); };
  }, []);
}

/* ===== shader intro (gold-tinted port of ShaderAnimation) ===== */
const VTX = "void main(){ gl_Position = vec4(position,1.0); }";
const FRAG = [
  "precision highp float;",
  "uniform vec2 resolution; uniform float time;",
  "void main(void){",
  "  vec2 uv=(gl_FragCoord.xy*2.0-resolution.xy)/min(resolution.x,resolution.y);",
  "  float t=time*0.05; float lw=0.0022; vec3 acc=vec3(0.0);",
  "  for(int j=0;j<3;j++){ for(int i=0;i<5;i++){",
  "    acc[j]+=lw*float(i*i)/abs(fract(t-0.01*float(j)+float(i)*0.01)*5.0-length(uv)+mod(uv.x+uv.y,0.2));",
  "  }}",
  "  float L=(acc.r+acc.g+acc.b)/3.0;",
  "  vec3 gold=vec3(0.90,0.68,0.32);",
  "  vec3 col=L*gold*2.3 + pow(L,2.2)*vec3(0.5,0.4,0.2);",
  "  gl_FragColor=vec4(col,1.0);",
  "}",
].join("\n");

function startIntroShader(): (() => void) | null {
  const canvas = document.getElementById("intro-canvas") as HTMLCanvasElement | null;
  if (!canvas) return null;
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const camera = new THREE.Camera();
  const scene = new THREE.Scene();
  const uniforms = { time: { value: 1.0 }, resolution: { value: new THREE.Vector2() } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VTX, fragmentShader: FRAG });
  const geo = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geo, material));
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
  };
  resize();
  window.addEventListener("resize", resize);
  canvas.classList.add("on");
  let raf = 0;
  // ~0.025/frame so the light sweep completes a single pulse across the 5s intro (was 0.05 → two pulses).
  const loop = () => { raf = requestAnimationFrame(loop); uniforms.time.value += 0.025; renderer.render(scene, camera); };
  loop();
  return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); geo.dispose(); material.dispose(); renderer.dispose(); };
}

/* ===== Three.js hero: dark gold-rimmed faceted object ===== */
function startHero(): (() => void) | null {
  const canvas = document.getElementById("hero-canvas") as HTMLCanvasElement | null;
  if (!canvas) return null;
  const stage = canvas.parentElement as HTMLElement;
  let w = stage.clientWidth, h = stage.clientHeight;
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" }); } catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.z = 7;

  const geo = new THREE.IcosahedronGeometry(2.0, 1);
  const core = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 0.95, roughness: 0.32, flatShading: true }));
  scene.add(core);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xe6b979, transparent: true, opacity: 0.55 }));
  core.add(edges);

  const key = new THREE.PointLight(0xf2dda8, 2.6, 60); key.position.set(5, 4, 6); scene.add(key);
  const rim = new THREE.PointLight(0xc6a559, 1.8, 60); rim.position.set(-6, -2, 3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x222222, 0.7));

  const P = 500, pos = new Float32Array(P * 3);
  for (let i = 0; i < P; i++) {
    const u = Math.random(), v = Math.random(), th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1), rr = 3.4 + Math.random() * 1.2;
    pos[i * 3] = rr * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th); pos[i * 3 + 2] = rr * Math.cos(ph);
  }
  const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const halo = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0xe6b979, size: 0.04, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(halo);

  const m = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = window.scrollY;
  const onMove = (e: MouseEvent) => { m.tx = e.clientX / window.innerWidth - 0.5; m.ty = e.clientY / window.innerHeight - 0.5; };
  const onScroll = () => { scrollY = window.scrollY; };
  const onResize = () => { w = stage.clientWidth; h = stage.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); };
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  let visible = true;
  const io = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0 });
  io.observe(stage);

  canvas.classList.add("ready");
  stage.classList.add("has-webgl");

  const clock = new THREE.Clock();
  const render = () => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    m.x += (m.tx - m.x) * 0.06; m.y += (m.ty - m.y) * 0.06;
    core.rotation.y = t * 0.25 + m.x * 0.9; core.rotation.x = t * 0.12 + m.y * 0.7;
    halo.rotation.y = -t * 0.06 + scrollY * 0.0002;
    key.position.x = 5 + m.x * 4; key.position.y = 4 - m.y * 4;
    renderer.render(scene, camera);
  };
  gsap.ticker.add(render);

  return () => {
    gsap.ticker.remove(render);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    io.disconnect();
    geo.dispose(); (core.material as THREE.Material).dispose(); pgeo.dispose(); renderer.dispose();
  };
}
