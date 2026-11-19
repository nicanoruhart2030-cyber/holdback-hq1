/* Fernando Uhart · DJ — site behaviour */

// ---- Contact settings: fill these in -------------------------------------
// WhatsApp number in international format, digits only (e.g. "5492231234567").
const WHATSAPP_NUMBER = "13657398284"; // +1 365 739 8284 (Canada)
// Full Instagram profile URL (e.g. "https://instagram.com/yourhandle").
const INSTAGRAM_URL = "https://instagram.com/fernandouhart";
// --------------------------------------------------------------------------

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("[data-year]").textContent = new Date().getFullYear();

  // Photo fallback (also covers hosts that block inline onerror handlers)
  const photo = $(".photo-frame img");
  const noPhoto = () => { const f = $(".photo-frame"); if (f) f.classList.add("is-empty"); photo && photo.remove(); };
  if (photo) {
    if (photo.complete && !photo.naturalWidth) noPhoto();
    else photo.addEventListener("error", noPhoto);
  }

  // Nav background once the page scrolls
  const nav = $("[data-nav]");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal on scroll, staggered within each group
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const siblings = $$(".reveal", e.target.parentElement);
      const i = Math.max(0, siblings.indexOf(e.target));
      const steps = [0, 90, 160, 210, 250, 280]; // shrinking gaps read as a wave, not a queue
      e.target.style.transitionDelay = `${steps[Math.min(i, steps.length - 1)]}ms`;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  // Stats count up the first time they're seen
  const fmt = (n, el) => el.dataset.format === "thousands" ? n.toLocaleString("en-US") : String(n);
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, end = +el.dataset.count;
      if (reduced) return;
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(end * eased), el);
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = fmt(0, el);
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  // ---- Timeline: buttons, progress, drag to scroll ----
  const track = $("[data-track]");
  const prev = $("[data-prev]"), next = $("[data-next]");
  const bar = $("[data-progress]");
  const scrub = $("[data-scrub]");
  const step = () => {
    const c = track.querySelector(".chapter");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return c ? c.getBoundingClientRect().width + gap : 336;
  };
  // Handle size shows how much of the timeline is in view; its position shows where.
  const thumbFrac = () => Math.min(1, Math.max(0.12, track.clientWidth / track.scrollWidth));
  // Nearest chapter, but let the end of the rail reach the last card
  const snapTarget = () => {
    const s = step(), max = track.scrollWidth - track.clientWidth, x = track.scrollLeft;
    return max - x < s / 2 ? max : Math.min(max, Math.round(x / s) * s);
  };
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 0;
    const f = thumbFrac();
    bar.style.width = `${f * 100}%`;
    bar.style.left = `${p * (1 - f) * 100}%`;
    scrub.setAttribute("aria-valuenow", String(Math.round(p * 100)));
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft > max - 4;
  };
  prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
  });
  update();

  // Scrollbar: drag the handle, or press the rail to jump there and keep dragging
  let scrubbing = false, grab = 0;
  const railPos = (clientX) => {
    const r = scrub.getBoundingClientRect();
    const thumbW = r.width * thumbFrac();
    const usable = r.width - thumbW;
    const x = clientX - r.left - grab;
    return usable > 0 ? Math.min(1, Math.max(0, x / usable)) : 0;
  };
  scrub.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const tb = bar.getBoundingClientRect();
    // Grabbing the handle keeps its offset; pressing the rail centres the handle under the pointer
    grab = (e.clientX >= tb.left && e.clientX <= tb.right) ? e.clientX - tb.left : tb.width / 2;
    scrubbing = true;
    scrub.setPointerCapture(e.pointerId);
    scrub.classList.add("is-active");
    track.classList.add("is-dragging");
    track.scrollLeft = railPos(e.clientX) * (track.scrollWidth - track.clientWidth);
    e.preventDefault();
  });
  scrub.addEventListener("pointermove", (e) => {
    if (!scrubbing) return;
    track.scrollLeft = railPos(e.clientX) * (track.scrollWidth - track.clientWidth);
  });
  const endScrub = () => {
    if (!scrubbing) return;
    scrubbing = false;
    scrub.classList.remove("is-active");
    track.classList.remove("is-dragging");
    track.scrollTo({ left: snapTarget(), behavior: "smooth" });
  };
  scrub.addEventListener("pointerup", endScrub);
  scrub.addEventListener("pointercancel", endScrub);
  scrub.addEventListener("keydown", (e) => {
    const max = track.scrollWidth - track.clientWidth;
    if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
    else if (e.key === "Home") { e.preventDefault(); track.scrollTo({ left: 0, behavior: "smooth" }); }
    else if (e.key === "End") { e.preventDefault(); track.scrollTo({ left: max, behavior: "smooth" }); }
  });

  // Mouse drag (touch already scrolls natively)
  let down = false, startX = 0, startLeft = 0, moved = false;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
  });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add("is-dragging"); }
    if (moved) track.scrollLeft = startLeft - dx;
  });
  addEventListener("pointerup", () => {
    if (!down) return;
    down = false;
    if (moved) {
      // let snap settle on the nearest chapter
      track.classList.remove("is-dragging");
      track.scrollTo({ left: snapTarget(), behavior: "smooth" });
    }
  });
  // Vertical wheel scrolls the timeline sideways only while it is hovered and has room
  track.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const max = track.scrollWidth - track.clientWidth;
    const atStart = track.scrollLeft <= 0 && e.deltaY < 0;
    const atEnd = track.scrollLeft >= max - 1 && e.deltaY > 0;
    if (atStart || atEnd) return;
    e.preventDefault();
    track.scrollLeft += e.deltaY;
  }, { passive: false });

  // ---- Social links ----
  const wa = $("[data-whatsapp]"), ig = $("[data-instagram]");
  const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  if (WHATSAPP_NUMBER) wa.href = waLink("Hola Fernando! I’d like to check a date for my party.");
  else wa.href = "#book";
  if (INSTAGRAM_URL) ig.href = INSTAGRAM_URL; else ig.href = "#book";
  [wa, ig].forEach((a) => { if (a.getAttribute("href") === "#book") a.removeAttribute("target"); });

  // ---- Booking form ----
  // No backend: the form writes the WhatsApp message, and the visitor sends it
  // with one tap. To receive requests by email instead, use a service like Formspree.
  const form = $("[data-form]");
  const err = $("[data-error]");
  const dateInput = $("#f-date");
  dateInput.min = new Date().toISOString().slice(0, 10);

  const fields = {
    name:     { el: $("#f-name"), err: $("#e-name"), msg: () => "Tell me your name." },
    date:     { el: $("#f-date"), err: $("#e-date"), msg: (v) => !v ? "Pick the date of your party." : (v < dateInput.min ? "That date has passed. Pick one coming up." : "") },
    type:     { el: $("#f-type"), err: $("#e-type"), msg: () => "Choose the type of party." },
    location: { el: $("#f-loc"),  err: $("#e-loc"),  msg: () => "Tell me the city or venue." },
  };
  const check = (key) => {
    const f = fields[key], v = String(f.el.value || "").trim();
    const m = key === "date" ? f.msg(v) : (v ? "" : f.msg());
    f.err.textContent = m;
    f.el.classList.toggle("is-invalid", !!m);
    f.el.setAttribute("aria-invalid", m ? "true" : "false");
    return !m;
  };
  let tried = false;
  Object.keys(fields).forEach((k) => {
    const ev = k === "type" || k === "date" ? "change" : "blur";
    fields[k].el.addEventListener(ev, () => { if (tried) check(k); });
    fields[k].el.addEventListener("input", () => { if (tried && fields[k].el.classList.contains("is-invalid")) check(k); });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    tried = true;
    const bad = Object.keys(fields).filter((k) => !check(k));
    if (bad.length) {
      err.textContent = bad.length === 1 ? "One thing is missing." : `${bad.length} things are missing.`;
      fields[bad[0]].el.focus();
      return;
    }
    err.textContent = "";
    const data = Object.fromEntries(new FormData(form));

    const when = new Date(data.date + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    const msg = [
      `Hola Fernando! Can you check this date?`,
      `• Name: ${data.name}`,
      `• Date: ${when}`,
      `• Party: ${data.type}`,
      `• Where: ${data.location}`,
      data.message ? `• Details: ${data.message}` : null,
    ].filter(Boolean).join("\n");

    const first = data.name.trim().split(/\s+/)[0];
    $(".form-body", form).hidden = true;
    $("[data-done]").hidden = false;
    $("[data-send]").href = waLink(msg);
    $("[data-done-text]").textContent = `Almost there, ${first}. Tap below and your message about ${when} goes straight to my WhatsApp.`;
    $("[data-send]").focus();
  });

  // ---- Records speed up under your hand (playbackRate eases, so they never jump) ----
  const spinTo = (els, target) => {
    els.forEach((el) => el.getAnimations().forEach((a) => {
      cancelAnimationFrame(a._raf);
      const tick = () => {
        const r = a.playbackRate + (target - a.playbackRate) * 0.12;
        a.playbackRate = Math.abs(target - r) < 0.01 ? target : r;
        if (a.playbackRate !== target) a._raf = requestAnimationFrame(tick);
      };
      tick();
    }));
  };
  const decks = $("[data-decks]");
  if (decks && !reduced) {
    const vinyls = $$(".vinyl", decks);
    decks.addEventListener("pointerenter", () => spinTo(vinyls, 2.6));
    decks.addEventListener("pointerleave", () => spinTo(vinyls, 1));
    decks.addEventListener("pointerdown", () => spinTo(vinyls, 2.6));
    decks.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") spinTo(vinyls, 1); });
  }
  const brand = $(".nav .brand");
  if (brand && !reduced) {
    const disc = [$(".brand-disc", brand)];
    brand.addEventListener("pointerenter", () => spinTo(disc, 4));
    brand.addEventListener("pointerleave", () => spinTo(disc, 1));
  }

  // ---- Venue strip: pause control (moving content must be stoppable) ----
  const strip = $("[data-marquee]"), toggle = $("[data-marquee-toggle]");
  if (strip && toggle) {
    toggle.addEventListener("click", () => {
      const paused = strip.classList.toggle("is-paused");
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Play the moving list" : "Pause the moving list");
    });
  }

  // ---- Current section in the nav ----
  const links = $$("[data-nav-link]");
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.setAttribute("aria-current", a.getAttribute("href") === `#${e.target.id}` ? "true" : "false"));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["journey", "music", "services"].forEach((id) => { const el = document.getElementById(id); if (el) secIO.observe(el); });
  const clearIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.setAttribute("aria-current", "false")); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  [$(".hero"), $("#book")].forEach((el) => el && clearIO.observe(el));

  // ---- Sticky booking bar on phones: after the hero, until the form is in view ----
  const ctaBar = $("[data-mobile-cta]");
  if (ctaBar) {
    const barLink = $("a", ctaBar);
    let pastHero = false, atBook = false;
    const sync = () => {
      const on = pastHero && !atBook;
      ctaBar.classList.toggle("is-on", on);
      ctaBar.setAttribute("aria-hidden", String(!on));
      barLink.tabIndex = on ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe($(".hero-actions"));
    new IntersectionObserver(([e]) => { atBook = e.isIntersecting; sync(); }, { rootMargin: "0px 0px -20% 0px" }).observe($("#book"));
  }
})();
