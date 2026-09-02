
// GSAP SETUP
// ==========================================================
if (hasGsap()) {
  const gsapPlugins = [];
  if (hasScrollTrigger()) gsapPlugins.push(window.ScrollTrigger);
  if (hasScrollToPlugin()) gsapPlugins.push(window.ScrollToPlugin);
  if (gsapPlugins.length) window.gsap.registerPlugin(...gsapPlugins);
}

const LENIS_CDN_SRC = "https://unpkg.com/lenis@1/dist/lenis.min.js";

// MAIN INITIALIZER
// ==========================================================
document.addEventListener("DOMContentLoaded", async () => {
  await initLenis();
  initNavbarMobile();
  initBackToTop();
  initNavbarOnScroll();
  initSmoothAnchors();
  initAnimations();
});

// LENIS SMOOTH SCROLL
// ==========================================================
async function initLenis() {
  if (window.__lenis || prefersReducedMotion() || !hasGsap() || !hasScrollTrigger()) return window.__lenis ?? null;

  try {
    await loadLenisScript();
  } catch (error) {
    console.warn("Lenis smooth scroll failed to load, using native scroll fallback.", error);
    return null;
  }

  if (!window.Lenis || window.__lenis) return window.__lenis ?? null;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false
  });

  window.lenis = lenis;
  window.__lenis = lenis;

  lenis.on("scroll", window.ScrollTrigger.update);

  window.gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  window.gsap.ticker.lagSmoothing(0);

  window.addEventListener("load", () => {
    window.ScrollTrigger.refresh();
  }, { once: true });

  return lenis;
}

function loadLenisScript() {
  if (window.Lenis) return Promise.resolve();
  if (window.__lenisScriptPromise) return window.__lenisScriptPromise;

  window.__lenisScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${LENIS_CDN_SRC}"]`);
    const script = existingScript || document.createElement("script");
    let didComplete = false;

    const timeout = window.setTimeout(() => {
      if (didComplete) return;
      didComplete = true;
      reject(new Error("Lenis script load timed out."));
    }, 3500);

    const complete = (callback) => {
      if (didComplete) return;
      didComplete = true;
      window.clearTimeout(timeout);
      callback();
    };

    script.addEventListener("load", () => complete(resolve), { once: true });
    script.addEventListener("error", () => complete(() => reject(new Error("Unable to load Lenis script."))), { once: true });

    if (!existingScript) {
      script.src = LENIS_CDN_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return window.__lenisScriptPromise;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasGsap() {
  return typeof window.gsap !== "undefined";
}

function hasScrollTrigger() {
  return typeof window.ScrollTrigger !== "undefined";
}

function hasScrollToPlugin() {
  return typeof window.ScrollToPlugin !== "undefined";
}

function smoothScrollTo(target, options = {}) {
  const reduce = prefersReducedMotion();
  const duration = reduce ? 0 : (options.duration ?? 0.8);
  const onComplete = typeof options.onComplete === "function" ? options.onComplete : null;
  const lenis = window.__lenis;

  if (lenis && !reduce && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(target, {
      duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      onComplete
    });
    return;
  }

  if (!hasGsap() || !hasScrollToPlugin()) {
    nativeScrollTo(target, reduce, duration, onComplete);
    return;
  }

  window.gsap.to(window, {
    duration,
    ease: reduce ? "none" : "power2.out",
    scrollTo: { y: target, autoKill: true },
    onComplete
  });
}

function nativeScrollTo(target, reduce, duration, onComplete) {
  const top = getScrollTargetTop(target);

  window.scrollTo({
    top,
    behavior: reduce ? "auto" : "smooth"
  });

  if (onComplete) {
    window.setTimeout(onComplete, reduce ? 0 : duration * 1000);
  }
}

function getScrollTargetTop(target) {
  if (typeof target === "number") return target;
  if (typeof target === "string") {
    const element = document.querySelector(target);
    return element ? getScrollTargetTop(element) : window.scrollY;
  }
  if (target instanceof Element) {
    return target.getBoundingClientRect().top + window.scrollY;
  }

  return window.scrollY;
}

// BACK TO TOP
// ==========================================================
function initBackToTop() {
  window.backToTop = function () {
    smoothScrollTo(0);
  };
}

// NAVBAR SCROLL BEHAVIOR (GLOBAL - NON GSAP)
// ==========================================================
function initNavbarOnScroll() {
  const navbar = document.getElementById("navbar");

  if (!navbar) return;

  let lastScroll = 0;
  const delta = 10;

  // Mengambil threshold 80% dari viewport
  const getThreshold = () => window.innerHeight * 0.8;
  let threshold = getThreshold();

  window.addEventListener("resize", () => {
    threshold = getThreshold();
  });

  window.addEventListener("scroll", () => {
    const scroll = window.scrollY;

    if (Math.abs(lastScroll - scroll) > delta) {
      navbar.style.top = scroll > lastScroll && scroll > threshold ? "-95px" : "0";
      lastScroll = scroll;
    }
  }, { passive: true });
}

// SMOOTH ANCHOR SCROLL
// ==========================================================
function initSmoothAnchors() {
  if (window.__smoothAnchorsInit) return;
  window.__smoothAnchorsInit = true;

  document.addEventListener("click", (e) => {

    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute("href");

    // skip kalau cuma "#"
    if (hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    smoothScrollTo(target, {
      onComplete: () => {
        if (history.pushState) history.pushState(null, "", hash);
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });
}

// NAVBAR MOBILE TOGGLE
// ==========================================================
function initNavbarMobile() {
  const navToggle = document.getElementById("nav-toggle");
  const navbar = document.getElementById("navbar");
  const body = document.body;

  if (!navToggle || !navbar) return;

  const closeNav = () => {
    navToggle.checked = false;
    body.style.overflowY = "auto";
  };

  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && e.target !== navToggle) {
      closeNav();
    }
  });

  navToggle.addEventListener("change", () => {
    body.style.overflowY = navToggle.checked ? "hidden" : "auto";
  });

  document
    .querySelectorAll(".nav-menu a")
    .forEach(link => link.addEventListener("click", closeNav));
}

// GET YEAR (NON GSAP)
// ==========================================================
const yearElement = document.getElementById("year");
if (yearElement) yearElement.textContent = getYear();
function getYear() {
  return new Date().getFullYear();
}

// GSAP ANIMATIONS WITH MATCHMEDIA
// ==========================================================
function initAnimations() {
  if (!hasGsap() || !hasScrollTrigger()) return;

  ScrollTrigger.matchMedia({

    // DESKTOP
    // =========================
    "(min-width: 768px)": function ()
    {
      
    },

    // MOBILE
    // =========================
    "(max-width: 767px)": function ()
    {
      
    },

    // ALL DEVICES
    // =========================
    "all": function ()
    {
      initScrollSpy();
      ScrollTrigger.refresh();
    }
  });

}

// GSAP FUNCTIONS
// ==========================================================
function initScrollSpy() {
  const sections = gsap.utils.toArray("section");
  const header = document.querySelector("header");

  // ---------- RESET SAAT DI HEADER ----------
  if (header) {
    ScrollTrigger.create({
      trigger: header,
      start: "top top",
      end: "bottom 60%",
      onEnter: clearActive,
      onEnterBack: clearActive
    });
  }

  // ---------- SECTION ACTIVE ----------
  sections.forEach(section => {

    ScrollTrigger.create({
      trigger: section,
      start: "top 60%",
      end: "bottom 60%",
      onEnter: () => setActive(section.id),
      onEnterBack: () => setActive(section.id)
    });

  });

  function setActive(id) {
    document
      .querySelectorAll(".nav-link")
      .forEach(link => link.classList.remove("active"));

    const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
    if (activeLink) activeLink.classList.add("active");
  }

  function clearActive() {
    document
      .querySelectorAll(".nav-link")
      .forEach(link => link.classList.remove("active"));
  }
}
