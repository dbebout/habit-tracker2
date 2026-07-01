/* ══════════════════════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════════════════════ */
const HABITS = [
  { id: "ai", label: "AI Classes", icon: "🤖", color: "#6366f1" },
  { id: "flex", label: "Flexibility", icon: "🧘", color: "#a855f7" },
  { id: "str", label: "Strength", icon: "💪", color: "#f97316" },
  { id: "golf", label: "Golf", icon: "⛳", color: "#22c55e" },
  { id: "cardio", label: "Cardio", icon: "🏃", color: "#ec4899" },
];

const MONTHS_L = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_S = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CIRC = 2 * Math.PI * 85; // 534.07…

/* ══════════════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════════════ */
let NOW = new Date();
let histM = NOW.getMonth();
let histY = NOW.getFullYear();
let prevScore = 0;
let fwActive = false;

/* ══════════════════════════════════════════════════════════════════
   STORAGE  (localStorage, keyed by year/month/day)
══════════════════════════════════════════════════════════════════ */
const sKey = (y, m, d) => `ph_${y}_${m}_${d}`;
const sSet = (y, m, d, v) =>
  localStorage.setItem(sKey(y, m, d), JSON.stringify(v));
const sGet = (y, m, d) => {
  try {
    return JSON.parse(localStorage.getItem(sKey(y, m, d)) || "{}");
  } catch {
    return {};
  }
};

/* ══════════════════════════════════════════════════════════════════
   SCORE HELPERS
══════════════════════════════════════════════════════════════════ */
function calcScore(data) {
  return HABITS.filter((h) => data[h.id]).length * 20;
}

function scoreColor(s) {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  if (s <= 0) return dark ? "#3a3f52" : "#c7cad4";
  if (s <= 60) return "#ef4444";
  if (s < 100) return "#eab308";
  return "#22c55e";
}

function scoreClass(s) {
  if (s <= 0) return "no-log";
  if (s <= 60) return "c-red";
  if (s < 100) return "c-yel";
  return "c-grn";
}

/* ══════════════════════════════════════════════════════════════════
   TODAY VIEW
══════════════════════════════════════════════════════════════════ */
function renderToday() {
  NOW = new Date();
  document.getElementById("today-date").textContent = NOW.toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  const data = sGet(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const score = calcScore(data);
  prevScore = score;
  buildCards(data);
  updateRing(score);
}

function buildCards(data) {
  const list = document.getElementById("habits-list");
  list.innerHTML = "";

  HABITS.forEach((h) => {
    const on = !!data[h.id];
    const card = document.createElement("div");
    card.className = "habit-card";

    if (on) {
      card.style.background = h.color + "15"; // ~8% tint
      card.style.borderColor = h.color + "55"; // ~33% border
    }

    card.innerHTML = `
      <div class="habit-icon" style="${on ? `background:${h.color}22` : ""}">${h.icon}</div>
      <div class="habit-info">
        <div class="habit-name">${h.label}</div>
        <div class="habit-pts">+20 pts</div>
      </div>
      <div class="toggle${on ? " on" : ""}" style="${on ? `background:${h.color}` : ""}">
        <div class="toggle-thumb"></div>
      </div>`;

    card.addEventListener("click", () => toggleHabit(h.id));
    list.appendChild(card);
  });
}

function toggleHabit(id) {
  NOW = new Date();
  const data = sGet(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  data[id] = !data[id];
  sSet(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), data);

  const score = calcScore(data);
  buildCards(data);
  updateRing(score);
  if (score === 100 && prevScore < 100) launchFireworks();
  prevScore = score;
}

function updateRing(s) {
  const arc = document.getElementById("ring-arc");
  const pct = document.getElementById("ring-pct");
  const cel = document.getElementById("celebrate");
  const color = scoreColor(s);

  arc.style.strokeDashoffset = CIRC - (s / 100) * CIRC;
  arc.style.stroke = color;
  pct.textContent = s + "%";
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  pct.style.color = s > 0 ? color : dark ? "#6b7380" : "#9aa1b0";
  cel.className = "celebrate" + (s === 100 ? " show" : "");
}

/* ══════════════════════════════════════════════════════════════════
   HISTORY VIEW
══════════════════════════════════════════════════════════════════ */
function renderHistory() {
  document.getElementById("month-name").textContent =
    `${MONTHS_L[histM]} ${histY}`;
  document.getElementById("year-hd").textContent = `${histY} Overview`;
  renderCalendar();
  renderMonthStats();
  renderYearGrid();
}

function renderCalendar() {
  NOW = new Date();
  const grid = document.getElementById("cal-grid");
  grid.innerHTML = "";

  const startDay = new Date(histY, histM, 1).getDay();
  const daysInM = new Date(histY, histM + 1, 0).getDate();
  const isCurMon = histY === NOW.getFullYear() && histM === NOW.getMonth();

  // Empty offset cells
  for (let i = 0; i < startDay; i++) {
    const e = document.createElement("div");
    e.className = "cday empty";
    grid.appendChild(e);
  }

  for (let d = 1; d <= daysInM; d++) {
    const el = document.createElement("div");
    const dayDate = new Date(histY, histM, d);
    const isFuture = dayDate > NOW && !(isCurMon && d === NOW.getDate());
    const isToday = isCurMon && d === NOW.getDate();

    if (isFuture) {
      el.className = "cday future";
      el.textContent = d;
    } else {
      const data = sGet(histY, histM, d);
      const s = calcScore(data);
      el.className = `cday ${scoreClass(s)}${isToday ? " today" : ""}`;
      el.innerHTML = `<span>${d}</span>${s > 0 ? `<span class="cday-sub">${s}%</span>` : ""}`;
    }
    grid.appendChild(el);
  }
}

function renderMonthStats() {
  NOW = new Date();
  const daysInM = new Date(histY, histM + 1, 0).getDate();
  const isCurMon = histY === NOW.getFullYear() && histM === NOW.getMonth();
  const limit = isCurMon ? NOW.getDate() : daysInM;
  let total = 0,
    perfect = 0,
    tracked = 0;

  for (let d = 1; d <= limit; d++) {
    const s = calcScore(sGet(histY, histM, d));
    if (s > 0) {
      total += s;
      tracked++;
    }
    if (s === 100) perfect++;
  }
  const avg = tracked > 0 ? Math.round(total / tracked) : 0;

  document.getElementById("mstats").innerHTML = `
    <div class="mstat">
      <div class="mstat-val" style="color:${avg > 0 ? scoreColor(avg) : "var(--dim)"}">
        ${avg > 0 ? avg + "%" : "—"}
      </div>
      <div class="mstat-lbl">Avg Score</div>
    </div>
    <div class="mstat">
      <div class="mstat-val" style="color:#22c55e">${perfect}</div>
      <div class="mstat-lbl">Perfect</div>
    </div>
    <div class="mstat">
      <div class="mstat-val">${tracked}</div>
      <div class="mstat-lbl">Logged</div>
    </div>`;
}

function renderYearGrid() {
  NOW = new Date();
  const grid = document.getElementById("year-grid");
  grid.innerHTML = "";

  MONTHS_S.forEach((name, m) => {
    const isFuture =
      histY > NOW.getFullYear() ||
      (histY === NOW.getFullYear() && m > NOW.getMonth());

    let total = 0,
      tracked = 0;
    if (!isFuture) {
      const days = new Date(histY, m + 1, 0).getDate();
      const limit =
        histY === NOW.getFullYear() && m === NOW.getMonth()
          ? NOW.getDate()
          : days;
      for (let d = 1; d <= limit; d++) {
        const s = calcScore(sGet(histY, m, d));
        if (s > 0) {
          total += s;
          tracked++;
        }
      }
    }

    const avg = tracked > 0 ? Math.round(total / tracked) : 0;
    const isCur = m === histM;
    const el = document.createElement("div");
    el.className = "ym" + (isCur ? " cur" : "");
    el.innerHTML = `
      <div class="ym-name">${name}</div>
      <div class="ym-avg" style="color:${isFuture || !tracked ? "var(--dim)" : scoreColor(avg)}">
        ${isFuture || !tracked ? "—" : avg + "%"}
      </div>`;
    el.addEventListener("click", () => {
      histM = m;
      renderHistory();
    });
    grid.appendChild(el);
  });
}

/* ══════════════════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════════════════ */
function switchTab(name) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
  if (name === "history") renderHistory();
}

document.getElementById("btn-prev").addEventListener("click", () => {
  histM--;
  if (histM < 0) {
    histM = 11;
    histY--;
  }
  renderHistory();
});

document.getElementById("btn-next").addEventListener("click", () => {
  histM++;
  if (histM > 11) {
    histM = 0;
    histY++;
  }
  renderHistory();
});

/* ══════════════════════════════════════════════════════════════════
   FIREWORKS
══════════════════════════════════════════════════════════════════ */
function launchFireworks() {
  if (fwActive) return;
  fwActive = true;

  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = "block";

  const COLORS = [
    "#22c55e",
    "#34d399",
    "#6366f1",
    "#a855f7",
    "#ec4899",
    "#f97316",
    "#38bdf8",
    "#eab308",
    "#f1f3f9",
  ];
  const particles = [];
  let shots = 0;
  const MAX_SHOTS = 8;

  function burst(x, y) {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < 100; i++) {
      const ang = (i / 100) * Math.PI * 2;
      const spd = 2 + Math.random() * 5.5;
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd * (0.5 + Math.random() * 0.9),
        vy: Math.sin(ang) * spd * (0.5 + Math.random() * 0.9) - 1,
        alpha: 1,
        color: c,
        size: 1.8 + Math.random() * 2.8,
        g: 0.05 + Math.random() * 0.05,
        decay: 0.96 + Math.random() * 0.02,
      });
    }
  }

  function fireShot() {
    if (shots >= MAX_SHOTS || !fwActive) return;
    shots++;
    burst(
      window.innerWidth * (0.15 + Math.random() * 0.7),
      window.innerHeight * (0.08 + Math.random() * 0.38),
    );
    if (shots < MAX_SHOTS) setTimeout(fireShot, 320 + Math.random() * 260);
  }
  fireShot();

  let frame = 0;
  function loop() {
    if (!fwActive) {
      canvas.style.display = "none";
      return;
    }
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx *= 0.992;
      p.alpha *= p.decay;
      if (p.alpha < 0.02) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (frame < 320 || particles.length > 0) {
      requestAnimationFrame(loop);
    } else {
      fwActive = false;
      canvas.style.display = "none";
    }
  }
  loop();

  // Safety timeout
  setTimeout(() => {
    fwActive = false;
  }, 6500);
}

/* ══════════════════════════════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════════════════════════════ */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("ph_theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta)
    meta.setAttribute("content", theme === "dark" ? "#0b0d12" : "#f5f6fa");
}

function initTheme() {
  const saved = localStorage.getItem("ph_theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const cur =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  applyTheme(cur === "dark" ? "light" : "dark");
  renderToday();
  const historyVisible = document
    .getElementById("view-history")
    .classList.contains("active");
  if (historyVisible) renderHistory();
}

document
  .getElementById("theme-toggle-btn")
  ?.addEventListener("click", toggleTheme);

/* ══════════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════════ */
initTheme();
renderToday();
