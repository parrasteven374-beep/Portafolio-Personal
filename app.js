/* ==========================================================
   Portafolio · Michael Parra
   ========================================================== */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const useGsap = !!window.gsap && !reduceMotion;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

if (window.gsap && window.Flip) gsap.registerPlugin(Flip);

/* ---------- Lenis: smooth scroll ---------- */
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new Lenis({ duration: .8, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  // GSAP y Lenis comparten el mismo ticker para que todo vaya sincronizado
  if (window.gsap) {
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

/* Anclas internas: scroll suave con Lenis (o nativo si no hay Lenis) */
function goTo(hash) {
  const target = hash === "#inicio" ? 0 : $(hash);
  if (target === null) return;
  if (lenis) lenis.scrollTo(target, { offset: hash === "#inicio" ? 0 : -20 });
  else (target === 0 ? window.scrollTo({ top: 0, behavior: "smooth" }) : target.scrollIntoView({ behavior: "smooth" }));
}
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const hash = a.getAttribute("href");
    if (hash.length < 2) return;
    e.preventDefault();
    closeMenu();
    goTo(hash);
  });
});

/* ---------- Iconos y AOS ---------- */
if (window.lucide) lucide.createIcons();
if (window.AOS) {
  AOS.init({ duration: 500, easing: "ease-out-cubic", once: true, offset: 50, disable: reduceMotion });
}
$("#year").textContent = new Date().getFullYear();

/* ---------- Menú móvil ---------- */
const burger = $("#burger");
const menu = $("#menu");
function closeMenu() {
  if (!menu.classList.contains("is-open")) return;
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  burger.setAttribute("aria-expanded", "false");
  if (lenis) lenis.start();
}
burger.addEventListener("click", () => {
  const open = !menu.classList.contains("is-open");
  menu.classList.toggle("is-open", open);
  menu.setAttribute("aria-hidden", String(!open));
  burger.setAttribute("aria-expanded", String(open));
  if (lenis) open ? lenis.stop() : lenis.start();
});
document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

/* ---------- Nav: estado al hacer scroll, sección activa e indicador ---------- */
const nav = $("#nav");
const links = $$(".nav__link");
const indicator = $(".nav__indicator");

function moveIndicator(link) {
  if (!link) { indicator.style.opacity = 0; return; }
  indicator.style.opacity = 1;
  indicator.style.width = link.offsetWidth + "px";
  indicator.style.transform = `translateX(${link.offsetLeft}px)`;
}
function setActive(id) {
  let active = null;
  links.forEach((l) => {
    const on = l.dataset.section === id;
    l.classList.toggle("is-active", on);
    if (on) active = l;
  });
  moveIndicator(active);
}

// Sección visible: la que cruza el centro del viewport
const sections = $$("main section[id]");
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => en.isIntersecting && setActive(en.target.id));
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => spy.observe(s));
window.addEventListener("resize", () => moveIndicator($(".nav__link.is-active")));

/* ---------- Scroll: barra de progreso + nav ---------- */
const bar = $("#progressBar");
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  nav.classList.toggle("is-scrolled", y > 30);
}
if (lenis) lenis.on("scroll", onScroll);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Hero: entrada con GSAP ---------- */
if (window.gsap && !reduceMotion) {
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from(".hero__eyebrow", { y: 16, opacity: 0, duration: .55 })
    .from(".hero__word", { yPercent: 110, duration: .7, stagger: .08 }, "-=.35")
    .from(".hero__lead", { y: 20, opacity: 0, duration: .6 }, "-=.45")
    .from(".hero__actions .btn", { y: 20, opacity: 0, duration: .55, stagger: .07 }, "-=.45")
    .from(".hero__loc", { opacity: 0, duration: .5 }, "-=.3")
    .from(".hero__card .code", { y: 40, opacity: 0, duration: .8 }, "-=.9")
    .from(".chip--float", { scale: .6, opacity: 0, duration: .55, stagger: .08, ease: "back.out(1.7)" }, "-=.45");
}

/* ---------- Spotlight: el brillo sigue al mouse ---------- */
if (finePointer) {
  $$("[data-spotlight]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* Tilt 3D sutil en tarjetas */
  $$("[data-tilt]").forEach((el) => {
    const max = el.classList.contains("code") ? 6 : 4;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-4px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });

  /* Botones magnéticos */
  if (window.gsap) {
    $$(".magnetic").forEach((btn) => {
      const mx = gsap.quickTo(btn, "x", { duration: .5, ease: "power3" });
      const my = gsap.quickTo(btn, "y", { duration: .5, ease: "power3" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * .25);
        my((e.clientY - (r.top + r.height / 2)) * .35);
      });
      btn.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  }
}

/* ---------- Contadores de "Sobre mí" ---------- */
const counters = $$("[data-count]");
const countObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    countObs.unobserve(en.target);
    const end = Number(en.target.dataset.count);
    const prefix = en.target.dataset.prefix || "";
    if (!window.gsap || reduceMotion) { en.target.textContent = prefix + end; return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: .9, ease: "power2.out", onUpdate: () => (en.target.textContent = prefix + Math.round(o.v)) });
  });
}, { threshold: .6 });
counters.forEach((c) => countObs.observe(c));

/* ---------- Tecnologías: iconos, brillo y filtros ---------- */
const ICON_URL = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

const grid = $("#techGrid");
const tiles = $$(".tile");
// Los efectos de mouse esperan a que termine la entrada en cascada
let tilesReady = !useGsap;

tiles.forEach((tile) => {
  tile.style.setProperty("--c", tile.dataset.c);
  const name = tile.dataset.icon;
  const img = new Image();
  img.className = "tile__icon";
  img.alt = "";
  img.loading = "lazy";
  img.src = `${ICON_URL}/${name}/${name}-original.svg`;
  // Si el icono no carga, se muestra la inicial en su lugar
  img.onerror = () => {
    const fb = document.createElement("span");
    fb.className = "tile__fallback";
    fb.textContent = $(".tile__name", tile).textContent.charAt(0);
    img.replaceWith(fb);
  };
  tile.prepend(img);

  if (finePointer) {
    tile.addEventListener("pointermove", (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
      tile.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }
});

/* Entrada en cascada al llegar a la grilla */
if (useGsap) {
  gsap.set(tiles, { opacity: 0, y: 40, scale: .92, rotationX: -25 });
  const entryObs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    entryObs.disconnect();
    gsap.to(tiles, {
      opacity: 1, y: 0, scale: 1, rotationX: 0, duration: .65, ease: "power4.out",
      stagger: { each: .03, from: "start" }, onComplete: () => (tilesReady = true),
    });
  }, { threshold: .15 });
  entryObs.observe(grid);
}

/* Tilt 3D bajo el cursor + los vecinos se apartan (repulsión) */
if (finePointer && useGsap) {
  const RADIUS = 190, PUSH = 14;
  let last = null, queued = false;

  const update = () => {
    queued = false;
    if (!last || !tilesReady) return;
    tiles.forEach((t) => {
      if (t.classList.contains("is-gone")) return;
      const r = t.getBoundingClientRect();
      const dx = r.left + r.width / 2 - last.x;
      const dy = r.top + r.height / 2 - last.y;
      const over = last.x >= r.left && last.x <= r.right && last.y >= r.top && last.y <= r.bottom;
      if (over) {
        const px = (last.x - r.left) / r.width - .5;
        const py = (last.y - r.top) / r.height - .5;
        gsap.to(t, { x: 0, y: 0, rotationY: px * 18, rotationX: -py * 18, scale: 1.06, duration: .35, ease: "power3.out", overwrite: "auto" });
      } else {
        const d = Math.hypot(dx, dy) || 1;
        const f = d < RADIUS ? 1 - d / RADIUS : 0;
        gsap.to(t, { x: (dx / d) * f * PUSH, y: (dy / d) * f * PUSH, rotationX: 0, rotationY: 0, scale: 1, duration: .4, ease: "power3.out", overwrite: "auto" });
      }
    });
  };

  grid.addEventListener("pointermove", (e) => {
    last = { x: e.clientX, y: e.clientY };
    if (!queued) { queued = true; requestAnimationFrame(update); }
  });
  grid.addEventListener("pointerleave", () => {
    last = null;
    if (tilesReady) gsap.to(tiles, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, duration: .6, ease: "elastic.out(1, .6)", overwrite: "auto" });
  });
}

/* Filtros: las tarjetas se reacomodan con Flip (sin Flip, aparecen/desaparecen directo) */
const filters = $$(".filter");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    const cat = btn.dataset.filter;
    const apply = () => tiles.forEach((t) => t.classList.toggle("is-gone", !(cat === "all" || t.dataset.cat === cat)));

    if (useGsap && window.Flip) {
      tilesReady = false;
      gsap.killTweensOf(tiles);
      gsap.set(tiles, { opacity: 1, x: 0, y: 0, scale: 1, rotationX: 0, rotationY: 0 });
      const state = Flip.getState(tiles);
      apply();
      Flip.from(state, {
        duration: .5, ease: "power3.inOut", absolute: true, scale: true, stagger: .02,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .4, ease: "power3.out", delay: .12 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: .7, duration: .25, ease: "power3.in" }),
        onComplete: () => (tilesReady = true),
      });
    } else {
      apply();
    }
    if (window.AOS) setTimeout(AOS.refresh, 900);
  });
});

/* ---------- Copiar correo ---------- */
const copyBtn = $("#copyBtn");
const copyText = $("#copyText");
copyBtn.addEventListener("click", async () => {
  const email = "parrasteven374@gmail.com";
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    // Respaldo para contextos sin permiso de portapapeles
    const ta = Object.assign(document.createElement("textarea"), { value: email });
    document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  copyBtn.classList.add("is-done");
  copyText.textContent = "¡Copiado!";
  setTimeout(() => { copyBtn.classList.remove("is-done"); copyText.textContent = "Copiar"; }, 2000);
});

/* ---------- Marquesina de tecnologías ---------- */
const marqueeRows = $$(".marquee__row");
if (marqueeRows.length) {
  const names = tiles.map((t) => $(".tile__name", t).textContent);
  const rows = marqueeRows.map((row, i) => {
    const list = i % 2 ? [...names].reverse() : names;
    const html = list.map((n) => `<span>${n}</span>`).join("");
    const track = $(".marquee__track", row);
    track.innerHTML = html + html; // el doble permite el bucle sin saltos
    return { track, dir: i % 2 ? 1 : -1, x: 0, half: 0 };
  });

  if (useGsap) {
    const measure = () => rows.forEach((r) => {
      r.half = r.track.scrollWidth / 2;
      if (r.dir > 0 && r.x === 0) r.x = -r.half;
    });
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);

    let visible = false, boost = 0;
    new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe($(".marquee"));

    gsap.ticker.add((time, delta) => {
      if (!visible) return;
      // El scroll acelera la marquesina; al frenar vuelve a su ritmo
      const v = lenis ? Math.min(Math.abs(lenis.velocity), 50) : 0;
      boost += (v - boost) * .08;
      const step = (.9 + boost * .4) * (delta / 16.67);
      rows.forEach((r) => {
        r.x += r.dir * step;
        if (r.dir < 0 && r.x <= -r.half) r.x += r.half;
        if (r.dir > 0 && r.x >= 0) r.x -= r.half;
        r.track.style.transform = `translate3d(${r.x}px,0,0)`;
      });
    });
  }
}

/* ---------- Títulos: revelado con máscara ---------- */
if (useGsap) {
  $$(".section__title, .contact__title").forEach((el) => {
    el.innerHTML = `<span class="reveal"><span class="reveal__in">${el.innerHTML}</span></span>`;
    const inner = $(".reveal__in", el);
    gsap.set(inner, { yPercent: 115 });
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      gsap.to(inner, { yPercent: 0, duration: .7, ease: "power4.out" });
    }, { threshold: .4 });
    io.observe(el);
  });
}

/* ---------- Cursor personalizado (solo con mouse) ---------- */
const cursor = $("#cursor");
if (finePointer && useGsap && cursor) {
  const ring = $(".cursor__ring", cursor);
  const dot = $(".cursor__dot", cursor);
  const rx = gsap.quickTo(ring, "x", { duration: .45, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: .45, ease: "power3" });
  const dx = gsap.quickTo(dot, "x", { duration: .1, ease: "power3" });
  const dy = gsap.quickTo(dot, "y", { duration: .1, ease: "power3" });
  window.addEventListener("pointermove", (e) => {
    cursor.classList.add("is-on");
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
  });
  document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("is-on"));
  document.addEventListener("pointerover", (e) => {
    cursor.classList.toggle("is-link", !!e.target.closest("a, button, .tile, [data-tilt]"));
  });
}
