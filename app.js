/* ====== Teman ====== */
const THEMES = {
  sol: {
    name: "Solresa",
    emoji: "🏖️",
    label: "Solresa",
    doneEmoji: "🍹",
    colors: ["#ff9e2c", "#ff5e62"],
  },
  skidor: {
    name: "Skidresa",
    emoji: "⛷️",
    label: "Skidresa",
    doneEmoji: "🎿",
    colors: ["#5e8bd6", "#a7d8ff"],
  },
  fotboll: {
    name: "Fotbollsläger",
    emoji: "⚽",
    label: "Fotbollsläger",
    doneEmoji: "🏆",
    colors: ["#1e9e54", "#7ee08a"],
  },
  fodelsedag: {
    name: "Födelsedag",
    emoji: "🎂",
    label: "Födelsedag",
    doneEmoji: "🥳",
    colors: ["#b94fd1", "#ff7ec7"],
  },
  kalas: {
    name: "Kalas",
    emoji: "🎉",
    label: "Kalas",
    doneEmoji: "🎊",
    colors: ["#ff4d8d", "#ffb02e"],
  },
  konsert: {
    name: "Konsert",
    emoji: "🎤",
    label: "Konsert",
    doneEmoji: "🎶",
    colors: ["#6a3df0", "#c33bd8"],
  },
  jul: {
    name: "Jul",
    emoji: "🎄",
    label: "Jul",
    doneEmoji: "🎅",
    colors: ["#0f7d4d", "#d12b2b"],
  },
  aventyr: {
    name: "Äventyr",
    emoji: "🏔️",
    label: "Äventyr",
    doneEmoji: "🧭",
    colors: ["#2c7a7b", "#68d391"],
  },
};
const DEFAULT_THEME = "sol";

/* ====== Element ====== */
const el = (id) => document.getElementById(id);
const formScreen = el("formScreen");
const countdownScreen = el("countdownScreen");
const form = el("countdownForm");
const titleInput = el("titleInput");
const dateInput = el("dateInput");
const themeGrid = el("themeGrid");
const savedSection = el("savedSection");
const savedList = el("savedList");

let selectedTheme = DEFAULT_THEME;
let tickTimer = null;

/* ====== Hjälpfunktioner ====== */
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "nedraknaren.saved.v1";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function showToast(msg) {
  const toast = el("toast");
  toast.textContent = msg;
  toast.hidden = false;
  // tvinga reflow så transition kör
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

/* Räkna ut tid kvar till midnatt på måldatumet */
function getRemaining(dateStr) {
  const target = new Date(dateStr + "T00:00:00").getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  return { done: false, days, hours, minutes, seconds };
}

/* ====== URL-kodning (för delning) ====== */
function encodeCountdown(data) {
  const json = JSON.stringify(data);
  // Unicode-säker base64
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeCountdown(str) {
  try {
    const json = decodeURIComponent(escape(atob(str)));
    const obj = JSON.parse(json);
    if (!obj.title || !obj.date) return null;
    if (!THEMES[obj.theme]) obj.theme = DEFAULT_THEME;
    return obj;
  } catch (e) {
    return null;
  }
}

function buildShareUrl(data) {
  const base = location.origin + location.pathname;
  return base + "#c=" + encodeCountdown(data);
}

/* ====== Sparade nedräkningar (localStorage) ====== */
function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function persistSaved(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    /* ignorera (t.ex. privat läge) */
  }
}

function saveCountdown(data) {
  const list = loadSaved();
  // ersätt om samma titel + datum redan finns
  const idx = list.findIndex(
    (c) => c.title === data.title && c.date === data.date
  );
  if (idx >= 0) list[idx] = data;
  else list.unshift(data);
  persistSaved(list.slice(0, 20));
}

function deleteSaved(data) {
  const list = loadSaved().filter(
    (c) => !(c.title === data.title && c.date === data.date)
  );
  persistSaved(list);
  renderSaved();
}

function renderSaved() {
  const list = loadSaved();
  if (list.length === 0) {
    savedSection.hidden = true;
    return;
  }
  savedSection.hidden = false;
  savedList.innerHTML = "";
  list.forEach((c) => {
    const theme = THEMES[c.theme] || THEMES[DEFAULT_THEME];
    const { days, done } = getRemaining(c.date);
    const li = document.createElement("li");
    li.className = "saved-item";

    const emoji = document.createElement("span");
    emoji.className = "si-emoji";
    emoji.textContent = theme.emoji;

    const info = document.createElement("div");
    info.className = "si-info";
    const t = document.createElement("div");
    t.className = "si-title";
    t.textContent = c.title;
    const sub = document.createElement("div");
    sub.className = "si-sub";
    sub.textContent = formatDate(c.date);
    info.append(t, sub);

    const daysEl = document.createElement("div");
    daysEl.className = "si-days";
    daysEl.textContent = done ? theme.doneEmoji : days + " d";

    const del = document.createElement("button");
    del.className = "si-delete";
    del.type = "button";
    del.setAttribute("aria-label", "Ta bort");
    del.textContent = "✕";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSaved(c);
    });

    li.addEventListener("click", () => showCountdown(c));
    li.append(emoji, info, daysEl, del);
    savedList.append(li);
  });
}

/* ====== Tema-väljare ====== */
function buildThemeGrid() {
  Object.entries(THEMES).forEach(([key, theme]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-btn";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", key === selectedTheme ? "true" : "false");
    btn.dataset.theme = key;
    btn.innerHTML = `<span class="emoji">${theme.emoji}</span><span class="name">${theme.name}</span>`;
    btn.addEventListener("click", () => selectTheme(key));
    themeGrid.append(btn);
  });
}

function selectTheme(key) {
  selectedTheme = key;
  [...themeGrid.children].forEach((b) =>
    b.setAttribute("aria-checked", b.dataset.theme === key ? "true" : "false")
  );
}

/* ====== Applicera tema-färger ====== */
function applyThemeColors(theme) {
  document.documentElement.style.setProperty("--bg", theme.colors[0]);
  document.documentElement.style.setProperty("--bg2", theme.colors[1]);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.colors[0]);
}

function resetThemeColors() {
  document.documentElement.style.setProperty("--bg", "#1d3557");
  document.documentElement.style.setProperty("--bg2", "#457b9d");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", "#1d3557");
}

/* ====== Visa nedräkning ====== */
let current = null;

function showCountdown(data) {
  current = data;
  const theme = THEMES[data.theme] || THEMES[DEFAULT_THEME];

  applyThemeColors(theme);
  el("cdThemeLabel").textContent = theme.label;
  el("cdTitle").textContent = data.title;
  el("cdDate").textContent = formatDate(data.date);
  el("cdDoneEmoji").textContent = theme.doneEmoji;

  document
    .querySelectorAll(".cd-emoji")
    .forEach((node) => (node.textContent = theme.emoji));

  formScreen.hidden = true;
  countdownScreen.hidden = false;
  window.scrollTo(0, 0);

  startTicking();
}

function startTicking() {
  stopTicking();
  tick();
  tickTimer = setInterval(tick, 1000);
}

function stopTicking() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
}

function tick() {
  if (!current) return;
  const r = getRemaining(current.date);
  const bigNumber = el("cdBigNumber");
  const clock = el("cdClock");
  const done = el("cdDone");

  if (r.done) {
    bigNumber.hidden = true;
    clock.hidden = true;
    done.hidden = false;
    stopTicking();
    return;
  }

  bigNumber.hidden = false;
  clock.hidden = false;
  done.hidden = true;

  el("cdDays").textContent = r.days;
  el("cdDaysUnit").textContent = r.days === 1 ? "dag kvar" : "dagar kvar";
  el("cdHours").textContent = pad(r.hours);
  el("cdMinutes").textContent = pad(r.minutes);
  el("cdSeconds").textContent = pad(r.seconds);
}

/* ====== Visa formulär ====== */
function showForm(prefill) {
  stopTicking();
  current = null;
  resetThemeColors();
  countdownScreen.hidden = true;
  formScreen.hidden = false;

  if (prefill) {
    titleInput.value = prefill.title || "";
    dateInput.value = prefill.date || "";
    selectTheme(THEMES[prefill.theme] ? prefill.theme : DEFAULT_THEME);
  }

  renderSaved();
  window.scrollTo(0, 0);
}

/* ====== Delning ====== */
async function shareCurrent() {
  if (!current) return;
  const url = buildShareUrl(current);
  const { days, done } = getRemaining(current.date);
  const theme = THEMES[current.theme] || THEMES[DEFAULT_THEME];
  const text = done
    ? `${theme.emoji} ${current.title} – dagen är här!`
    : `${theme.emoji} ${days} ${days === 1 ? "dag" : "dagar"} kvar till ${current.title}!`;

  if (navigator.share) {
    try {
      await navigator.share({ title: current.title, text, url });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
  }
  // Fallback: kopiera länk
  try {
    await navigator.clipboard.writeText(url);
    showToast("Länk kopierad! 📋");
  } catch (e) {
    prompt("Kopiera länken och dela:", url);
  }
}

/* ====== Init ====== */
function init() {
  buildThemeGrid();

  // Förvalt datum: två veckor framåt
  const d = new Date();
  d.setDate(d.getDate() + 14);
  dateInput.min = new Date().toISOString().split("T")[0];
  dateInput.value = d.toISOString().split("T")[0];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      title: titleInput.value.trim(),
      date: dateInput.value,
      theme: selectedTheme,
    };
    if (!data.title || !data.date) return;
    saveCountdown(data);
    showCountdown(data);
  });

  el("shareBtn").addEventListener("click", shareCurrent);
  el("editBtn").addEventListener("click", () => showForm(current));

  // Pausa/återuppta timer när fliken byts
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTicking();
    else if (current && !countdownScreen.hidden) startTicking();
  });

  // Delad länk via hash?
  if (location.hash.startsWith("#c=")) {
    const shared = decodeCountdown(location.hash.slice(3));
    if (shared) {
      showCountdown(shared);
      return;
    }
  }

  showForm();
}

init();
