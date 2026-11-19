/* Fernando Uhart · DJ — site behaviour */

// ---- Contact settings: fill these in -------------------------------------
// WhatsApp number in international format, digits only (e.g. "5492231234567").
const WHATSAPP_NUMBER = "";
// Full Instagram profile URL (e.g. "https://instagram.com/yourhandle").
const INSTAGRAM_URL = "";
// --------------------------------------------------------------------------

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("[data-year]").textContent = new Date().getFullYear();

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
      e.target.style.transitionDelay = `${Math.min(i, 5) * 80}ms`;
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
  const step = () => {
    const c = track.querySelector(".chapter");
    return c ? c.getBoundingClientRect().width + 20 : 340;
  };
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 0;
    bar.style.width = `${Math.max(6, p * 100)}%`;
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
      const s = step();
      track.scrollTo({ left: Math.round(track.scrollLeft / s) * s, behavior: "smooth" });
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
  if (WHATSAPP_NUMBER) wa.href = waLink("Hi Fernando! I'd like to ask about a date for my event.");
  else wa.href = "#book";
  if (INSTAGRAM_URL) ig.href = INSTAGRAM_URL; else ig.href = "#book";
  [wa, ig].forEach((a) => { if (a.getAttribute("href") === "#book") a.removeAttribute("target"); });

  // ---- Booking form ----
  // Without a backend, the request opens WhatsApp with everything pre-filled.
  // To receive it by email instead, point the form at a service like Formspree.
  const form = $("[data-form]");
  const err = $("[data-error]");
  const dateInput = $("#f-date");
  dateInput.min = new Date().toISOString().slice(0, 10);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const required = ["name", "date", "type", "location"];
    let firstBad = null;
    required.forEach((k) => {
      const el = form.elements[k];
      const bad = !String(data[k] || "").trim();
      el.classList.toggle("is-invalid", bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      err.textContent = "Please fill in your name, the date, the event type and the location.";
      firstBad.focus();
      return;
    }
    err.textContent = "";

    const when = new Date(data.date + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    const msg = [
      `Hi Fernando! Booking request:`,
      `• Name: ${data.name}`,
      `• Date: ${when}`,
      `• Event: ${data.type}`,
      `• Location: ${data.location}`,
      data.message ? `• Details: ${data.message}` : null,
    ].filter(Boolean).join("\n");

    if (WHATSAPP_NUMBER) window.open(waLink(msg), "_blank", "noopener");

    $(".form-body", form).hidden = true;
    $("[data-done]").hidden = false;
    $("[data-done-text]").textContent = `Thanks, ${data.name.split(" ")[0]}. Fernando will be in touch about ${when}.`;
  });
  form.addEventListener("input", (e) => {
    if (e.target.classList.contains("is-invalid") && e.target.value.trim()) e.target.classList.remove("is-invalid");
  });
})();
