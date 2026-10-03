/* ==========================================================
   Portafolio · Michael Parra
   ========================================================== */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Lenis: smooth scroll ---------- */
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
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
  AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 70, disable: reduceMotion });
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
  tl.from(".hero__eyebrow", { y: 16, opacity: 0, duration: .8 })
    .from(".hero__word", { yPercent: 110, duration: 1.1, stagger: .12 }, "-=.5")
    .from(".hero__lead", { y: 20, opacity: 0, duration: .9 }, "-=.7")
    .from(".hero__actions .btn", { y: 20, opacity: 0, duration: .8, stagger: .1 }, "-=.7")
    .from(".hero__loc", { opacity: 0, duration: .8 }, "-=.5")
    .from(".hero__card .code", { y: 40, opacity: 0, duration: 1.2 }, "-=1.3")
    .from(".chip--float", { scale: .6, opacity: 0, duration: .8, stagger: .12, ease: "back.out(1.7)" }, "-=.7");
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

  // Luz que sigue al cursor en el hero
  const hero = $(".hero");
  const spot = $("#heroSpot");
  if (window.gsap) {
    const sx = gsap.quickTo(spot, "x", { duration: .8, ease: "power3" });
    const sy = gsap.quickTo(spot, "y", { duration: .8, ease: "power3" });
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      sx(e.clientX - r.left); sy(e.clientY - r.top);
    });
  }

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
    if (!window.gsap || reduceMotion) { en.target.textContent = end; return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.4, ease: "power2.out", onUpdate: () => (en.target.textContent = Math.round(o.v)) });
  });
}, { threshold: .6 });
counters.forEach((c) => countObs.observe(c));

/* ---------- Tecnologías: iconos, brillo y filtros ---------- */
const ICON_URL = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

$$(".tile").forEach((tile) => {
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

const filters = $$(".filter");
const tiles = $$(".tile");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    const cat = btn.dataset.filter;
    tiles.forEach((t) => {
      const show = cat === "all" || t.dataset.cat === cat;
      if (show) {
        t.classList.remove("is-gone");
        requestAnimationFrame(() => t.classList.remove("is-hidden"));
      } else {
        t.classList.add("is-hidden");
        setTimeout(() => t.classList.contains("is-hidden") && t.classList.add("is-gone"), 300);
      }
    });
    if (window.AOS) setTimeout(AOS.refresh, 350);
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
