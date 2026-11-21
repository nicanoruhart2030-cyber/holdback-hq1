/* Renders the page from window.PROFILE and runs the two stageshow scenes. */
(() => {
  const P = window.PROFILE || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const todo = (what) => `<span class="todo">Add ${esc(what)} from LinkedIn</span>`;
  const skel = (w) => `<span class="skel-line" style="width:${w}"></span>`;
  const thisYear = new Date().getFullYear();

  document.documentElement.classList.remove("no-js");
  $("[data-year]").textContent = thisYear;

  // ---- Simple fields ----
  $$("[data-f=name]").forEach((el) => (el.textContent = P.name || "Fernando Uhart"));
  $$("[data-linkedin]").forEach((a) => (a.href = P.linkedin));
  $$("[data-f=headline]").forEach((el) => (el.innerHTML = P.headline ? esc(P.headline) : todo("headline")));
  $$("[data-f=location]").forEach((el) => (el.textContent = P.location || ""));
  if (!P.location) $("[data-loc-row]").hidden = true;
  $$("[data-f=headline-short]").forEach((el) => (el.innerHTML = P.headline ? esc(P.headline.split(/[|·]/)[0].trim()) : skel("160px")));
  if (P.headline) document.title = `${P.name} · ${P.headline}`;

  // ---- About ----
  $("[data-about]").innerHTML = P.about && P.about.length
    ? P.about.map((p) => `<p>${esc(p)}</p>`).join("")
    : `<div class="todo-block">${skel("88%")}${skel("94%")}${skel("72%")}<p>${todo("the About section")}</p></div>`;

  // ---- Experience ----
  const roles = (P.experience || []).filter((r) => r && (r.title || r.company));
  $("[data-roles]").innerHTML = roles.length
    ? roles.map((r) => `
      <li class="role reveal">
        <p class="role-years">${esc(r.start || "")}${r.end ? "–" + esc(r.end) : ""}</p>
        <div>
          <h3 class="role-title">${esc(r.title || "")}</h3>
          ${r.company ? `<p class="role-co">${esc(r.company)}</p>` : ""}
          ${r.location ? `<p class="role-meta">${esc(r.location)}</p>` : ""}
          ${r.summary ? `<p class="role-sum">${esc(r.summary)}</p>` : ""}
          ${r.bullets && r.bullets.length ? `<ul class="role-bullets">${r.bullets.map((b) => `<li>${b.head ? `<strong>${esc(b.head)}.</strong> ` : ""}${esc(b.text)}</li>`).join("")}</ul>` : ""}
          ${r.clients && r.clients.length ? `<p class="role-clients"><span>Clients</span>${r.clients.map((c) => `<em>${esc(c)}</em>`).join("")}</p>` : ""}
        </div>
      </li>`).join("")
    : [0, 1, 2].map((i) => `
      <li class="role reveal">
        <p class="role-years">${skel("70px")}</p>
        <div>${skel(["62%", "54%", "48%"][i])}${skel(["34%", "40%", "30%"][i])}${i === 0 ? `<p style="margin-top:16px">${todo("each role (title, company, dates)")}</p>` : ""}</div>
      </li>`).join("");

  // ---- Skills / education / languages ----
  const skills = P.skills || [];
  $("[data-skills]").innerHTML = skills.length ? skills.map((s) => `<li>${esc(s)}</li>`).join("") : `<li class="todo">Add skills from LinkedIn</li>`;
  if (P.skillsMore && skills.length) { const a = $("[data-skills-more]"); a.href = P.skillsMore; a.hidden = false; }
  if (P.educationMore && (P.education || []).length) { const a = $("[data-edu-more]"); a.href = P.educationMore; a.hidden = false; }
  // ---- Highlights ----
  const hl = P.highlights || [];
  if (hl.length) {
    $("[data-highlights]").innerHTML = hl.map((h) => `
      <div class="hl reveal"><dt class="hl-label">${esc(h.label)}</dt><dd class="hl-value">${esc(h.value)}${h.unit ? ` <span>${esc(h.unit)}</span>` : ""}</dd></div>`).join("");
  } else $("[data-highlights-wrap]").hidden = true;
  const edu = P.education || [];
  $("[data-education]").innerHTML = edu.length
    ? edu.map((e) => `<li><p class="p-main">${esc(e.school || "")}</p><p class="p-sub">${esc([e.degree, [e.start, e.end].filter(Boolean).join("–")].filter(Boolean).join(" · "))}</p></li>`).join("")
    : `<li>${todo("education")}</li>`;
  const langs = P.languages || [];
  $("[data-languages]").innerHTML = langs.length
    ? langs.map((l) => `<li><p class="p-main">${esc(l.name || "")}</p>${l.level ? `<p class="p-sub">${esc(l.level)}</p>` : ""}</li>`).join("")
    : `<li>${todo("languages")}</li>`;

  // ---- Email (optional) ----
  if (P.email) {
    const a = $("[data-email]");
    a.hidden = false;
    a.href = `mailto:${P.email}`;
    $("[data-email-text]").textContent = P.email;
  }

  // ---- Hero scene: career timeline ----
  const lanesEl = $("[data-lanes]");
  const axisEl = $("[data-axis]");
  let spans; // [{ start, end, title, company, years }]
  const toYear = (v) => {
    if (String(v).toLowerCase().startsWith("present")) return thisYear;
    const m = String(v).match(/\d{4}/);
    return m ? parseInt(m[0], 10) : NaN;
  };
  const dated = roles.filter((r) => !Number.isNaN(toYear(r.start)));
  if (dated.length) {
    // One row per lane (company and country); roles in a lane merge into one span
    const lanes = new Map();
    dated.forEach((r) => {
      const key = r.lane || r.company || r.title;
      const s = toYear(r.start), e = r.end ? toYear(r.end) : toYear(r.start) + 1;
      const now = String(r.end || "").toLowerCase().startsWith("present");
      const cur = lanes.get(key);
      if (!cur) lanes.set(key, { start: s, end: e, title: r.title || "", company: key, now, roles: 1 });
      else { cur.start = Math.min(cur.start, s); cur.end = Math.max(cur.end, e); cur.now = cur.now || now; cur.roles++; }
    });
    spans = [...lanes.values()].slice(0, 8).map((l) => ({
      ...l,
      years: `${l.start}–${l.now ? "Present" : l.end}`,
      title: l.roles > 1 ? `${l.title} (+${l.roles - 1} more role${l.roles > 2 ? "s" : ""})` : l.title,
    })).reverse(); // oldest at the top
    const min = Math.min(...spans.map((s) => s.start));
    const max = Math.max(...spans.map((s) => s.end));
    const range = Math.max(1, max - min);
    const pct = (y) => ((y - min) / range) * 100;
    const ticks = [min, Math.round(min + range / 3), Math.round(min + (2 * range) / 3), max];
    axisEl.innerHTML = ticks.map((t) => `<span style="left:${Math.min(96, Math.max(4, pct(t)))}%">${t}</span>`).join("");
    lanesEl.innerHTML = spans.map((s) => `
      <div class="lane"><span class="lane-label">${esc(s.company)}</span>
        <span class="lane-track"><span class="bar${s.now ? " is-now" : ""}" style="left:${pct(s.start)}%;width:${Math.max(3, pct(s.end) - pct(s.start))}%"></span></span></div>`).join("");
  } else {
    // No data yet: neutral placeholder bars, like a product shot before content loads
    const fake = [[0, 22], [18, 38], [36, 58], [55, 80], [78, 100]];
    spans = fake.map(() => null);
    axisEl.innerHTML = [6, 36, 66, 94].map((l) => `<i style="left:${l}%"></i>`).join("");
    lanesEl.innerHTML = fake.map(([a, b], i) => `
      <div class="lane"><span class="lane-label">${skel(["70%", "54%", "82%", "60%", "74%"][i])}</span>
        <span class="lane-track"><span class="bar${i === fake.length - 1 ? " is-now" : ""}" style="left:${a}%;width:${b - a}%"></span></span></div>`).join("");
  }

  const stage = $("[data-stage-hero]");
  const win = $(".window", stage);
  const tip = $("[data-tip]");
  const cursor = $("[data-cursor]");
  const bars = $$(".bar", stage);

  function fillTip(i) {
    const s = spans[i];
    $("[data-tip-years]").innerHTML = s ? esc(s.years) : skel("64px");
    $("[data-tip-title]").innerHTML = s ? esc(s.title) : skel("150px");
    $("[data-tip-co]").innerHTML = s ? esc(s.company) : skel("110px");
  }
  function placeTip(bar) {
    const w = win.getBoundingClientRect();
    const b = bar.getBoundingClientRect();
    const tw = tip.offsetWidth;
    let x = b.left - w.left + b.width / 2 - tw / 2;
    x = Math.max(12, Math.min(w.width - tw - 12, x));
    // Above the bar when there is room below the header row, otherwise below it
    const lanesTop = $("[data-lanes]").getBoundingClientRect().top - w.top;
    const above = b.top - w.top - tip.offsetHeight - 10;
    const below = b.bottom - w.top + 10;
    const y = above >= lanesTop - 4 ? above : below;
    tip.style.transformOrigin = y === above ? "50% 100%" : "50% 0%";
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }
  const barPoint = (bar) => {
    const w = win.getBoundingClientRect();
    const b = bar.getBoundingClientRect();
    return { x: b.left - w.left + Math.min(b.width * 0.6, b.width - 6), y: b.top - w.top + b.height * 0.6 };
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const moveCursor = (el, from, to, dur) =>
    el.animate([{ transform: `translate(${from.x}px, ${from.y}px)` }, { transform: `translate(${to.x}px, ${to.y}px)` }],
      { duration: dur, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" }).finished;

  function showStatic() {
    const last = bars[bars.length - 1];
    if (!last) return;
    last.classList.add("is-hot");
    fillTip(bars.length - 1);
    tip.classList.add("is-on");
    requestAnimationFrame(() => placeTip(last));
  }

  // Loop: the cursor visits roles oldest to newest, a card shows each one. Runs only while visible.
  let heroVisible = false;
  let heroRunning = false;
  async function heroLoop() {
    if (heroRunning) return;
    heroRunning = true;
    let pos = { x: win.clientWidth * 0.85, y: win.clientHeight * 0.95 };
    cursor.style.opacity = 1;
    const order = bars.length > 4 ? [0, 2, bars.length - 1] : bars.map((_, i) => i);
    while (heroVisible) {
      for (const i of order) {
        if (!heroVisible) break;
        const bar = bars[i];
        const to = barPoint(bar);
        await moveCursor(cursor, pos, to, 900);
        pos = to;
        bars.forEach((b) => b.classList.toggle("is-hot", b === bar));
        fillTip(i);
        placeTip(bar);
        tip.classList.add("is-on");
        await sleep(i === order[order.length - 1] ? 2600 : 1700);
        tip.classList.remove("is-on");
        await sleep(180);
      }
      bars.forEach((b) => b.classList.remove("is-hot"));
      await sleep(500);
    }
    heroRunning = false;
  }

  if (reduced) showStatic();
  else {
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      if (heroVisible) setTimeout(heroLoop, 700);
    }, { threshold: 0.4 }).observe(stage);
  }

  // ---- Contact scene: a message typed and sent ----
  const msg = $("[data-stage-msg]");
  const mwin = $(".window", msg);
  const typed = $("[data-typed]");
  const send = $("[data-send]");
  const toast = $("[data-toast]");
  const cursor2 = $("[data-cursor2]");
  const subject = "Let’s talk";
  let msgVisible = false;
  let msgRunning = false;
  const sendPoint = () => {
    const w = mwin.getBoundingClientRect();
    const b = send.getBoundingClientRect();
    return { x: b.left - w.left + b.width * 0.45, y: b.top - w.top + b.height * 0.55 };
  };
  async function msgLoop() {
    if (msgRunning) return;
    msgRunning = true;
    while (msgVisible) {
      typed.textContent = "";
      toast.classList.remove("is-on");
      cursor2.style.opacity = 0;
      await sleep(600);
      for (const ch of subject) {
        if (!msgVisible) break;
        typed.textContent += ch;
        await sleep(70 + Math.random() * 60);
      }
      await sleep(500);
      cursor2.style.opacity = 1;
      const start = { x: mwin.clientWidth * 0.3, y: mwin.clientHeight * 0.55 };
      const to = sendPoint();
      await moveCursor(cursor2, start, to, 900);
      send.classList.add("is-pressed");
      await sleep(140);
      send.classList.remove("is-pressed");
      toast.classList.add("is-on");
      await sleep(400);
      await moveCursor(cursor2, to, { x: to.x - 40, y: to.y + 60 }, 600);
      await sleep(2400);
    }
    msgRunning = false;
  }
  if (reduced) {
    typed.textContent = subject;
    $("[data-caret]").hidden = true;
  } else {
    new IntersectionObserver(([e]) => {
      msgVisible = e.isIntersecting;
      if (msgVisible) msgLoop();
    }, { threshold: 0.5 }).observe(msg);
  }

  // ---- Scroll reveals, with shrinking gaps ----
  const steps = [0, 90, 160, 210, 250];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const sibs = $$(".reveal", e.target.parentElement);
      e.target.style.transitionDelay = `${steps[Math.min(sibs.indexOf(e.target), steps.length - 1)]}ms`;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  // ---- Nav: border on scroll, current section ----
  const nav = $("[data-nav]");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const links = $$("[data-link]");
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.setAttribute("aria-current", a.getAttribute("href") === `#${e.target.id}` ? "true" : "false"));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["about", "experience", "skills", "contact"].forEach((id) => secIO.observe(document.getElementById(id)));
  new IntersectionObserver(([e]) => { if (e.isIntersecting) links.forEach((a) => a.setAttribute("aria-current", "false")); }, { rootMargin: "-45% 0px -50% 0px" }).observe($("#top"));
})();
