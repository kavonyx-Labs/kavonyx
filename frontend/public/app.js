"use strict";

const ROUTES = JSON.parse(document.getElementById("routeData").textContent);
const scripts = new Set();
let shown = 0;

function normalize(pathname) {
  const path = pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
  return path === "" ? "/" : path + "/";
}

function routeFor(pathname) {
  const path = normalize(pathname);
  return ROUTES.find((r) => r.path === path) || null;
}

function samePlace(a, path) {
  if (a.classList.contains("brand") || a.classList.contains("skip")) return false;
  if (a.target && a.target !== "_self") return false;
  let url;
  try { url = new URL(a.href, location.origin); } catch { return false; }
  if (url.origin !== location.origin) return false;
  if (normalize(url.pathname) !== path) return false;
  return url.hash ? url.hash === location.hash : true;
}

function markNav(path) {
  document.querySelectorAll("a[href]").forEach((a) => {
    if (samePlace(a, path)) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.querySelectorAll(".is-here").forEach((el) => el.classList.remove("is-here"));
  const id = location.hash.replace(/^#/, "");
  if (id) document.getElementById(id)?.classList.add("is-here");
}

function closeMenu() {
  document.body.classList.remove("nav-open");
  const menu = document.querySelector(".menu");
  if (menu) menu.setAttribute("aria-expanded", "false");
}

function ensureScript(src) {
  if (!src) return Promise.resolve();
  if (scripts.has(src)) return Promise.resolve();
  scripts.add(src);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    if (src.includes("table.js")) s.type = "module";
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(src));
    document.body.appendChild(s);
  });
}

async function show(meta) {
  const gen = ++shown;
  const main = document.getElementById("main");
  const tpl = document.querySelector(`template[data-route="${meta.path}"]`);
  main.replaceChildren(tpl.content.firstElementChild.cloneNode(true));
  document.title = meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", meta.desc);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", meta.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.desc);
  markNav(meta.path);
  try {
    await ensureScript(meta.script);
  } catch {
    /* the sheet still shows without its script */
  }
  if (gen !== shown) return;
  if (meta.path === "/" && window.mountFort) window.mountFort();
  if (meta.path === "/table/" && window.mountTable) window.mountTable();
  wireCaControls();
  const hash = location.hash.slice(1);
  const target = hash ? document.getElementById(hash) : null;
  if (target) target.scrollIntoView();
  else window.scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || (a.target && a.target !== "_self")) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  const url = new URL(a.href, location.origin);
  if (url.origin !== location.origin) return;
  const meta = routeFor(url.pathname);
  if (!meta) return;
  e.preventDefault();
  const next = meta.path + url.search + url.hash;
  if (location.pathname + location.search + location.hash !== next) history.pushState(null, "", next);
  show(meta);
  closeMenu();
});

window.addEventListener("popstate", () => {
  show(routeFor(location.pathname) || ROUTES[0]);
  closeMenu();
});

const menu = document.querySelector(".menu");
if (menu) {
  menu.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    menu.setAttribute("aria-expanded", String(open));
  });
}

function fillAddress(el, ca) {
  const main = el.querySelector(".ca-addr-main");
  const tail = el.querySelector(".ca-addr-tail");
  const end = ca.slice(-5);
  const head = ca.slice(0, -5);
  main.textContent = head;
  tail.textContent = end;
  main.style.letterSpacing = "0px";
  const box = el.clientWidth;
  const tailW = tail.getBoundingClientRect().width;
  if (!box || tailW <= 0) return;
  const range = document.createRange();
  range.selectNodeContents(main);
  const headW = range.getBoundingClientRect().width;
  const extra = box - headW - tailW;
  if (extra > 1 && head.length > 1) main.style.letterSpacing = extra / head.length + "px";
}

let siteCa = "";
let siteKeyText = null;
let siteTokenText = null;

function paintAddress() {
  const addr = document.getElementById("caAddr");
  const buy = document.getElementById("caBuy");
  const btn = document.getElementById("caCopy");
  if (!addr) return;
  if (!siteCa) return;
  addr.classList.remove("is-pending");
  if (btn) btn.hidden = false;
  if (buy) buy.dataset.url = "https://gmgn.ai/bsc/token/" + siteCa;
  fillAddress(addr, siteCa);
}

function wireCaControls() {
  const bar = document.getElementById("caBar");
  if (!bar) return;
  paintAddress();
  const ticker = document.getElementById("caTicker");
  if (ticker && siteTokenText) applyTicker(siteTokenText);
  if (bar.dataset.wired === "1") return;
  bar.dataset.wired = "1";
  const btn = document.getElementById("caCopy");
  const buy = document.getElementById("caBuy");
  const addr = document.getElementById("caAddr");
  btn.addEventListener("click", async () => {
    if (!siteCa) return;
    try {
      await navigator.clipboard.writeText(siteCa);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = siteCa;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = "Copy"), 1400);
  });
  buy.addEventListener("click", () => {
    const url = buy.dataset.url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
  if (window.ResizeObserver) new ResizeObserver(() => paintAddress()).observe(addr);
  if (document.fonts) document.fonts.ready.then(() => paintAddress());
}

function applyTicker(raw) {
  const ticker = document.getElementById("caTicker");
  if (!ticker) return;
  let symbol = "KVNX";
  try {
    symbol = String(JSON.parse(raw).ticker || "KVNX").replace(/[^A-Z0-9]/gi, "") || "KVNX";
  } catch {
    /* keep the current symbol */
  }
  ticker.textContent = "$" + symbol;
}

function safeHttp(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "https:" || u.protocol === "http:") return u.href;
  } catch {
    /* key.txt has no address for this link yet */
  }
  return "";
}

function contactUrl(name, value) {
  const direct = safeHttp(value);
  if (direct) return direct;
  const handle = String(value || "").replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{1,32}$/.test(handle)) return "";
  if (name === "github") return "https://github.com/" + handle;
  if (name === "telegram") return "https://t.me/" + handle;
  if (name === "x") return "https://x.com/" + handle;
  return "";
}

function parseKeys(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z][\w-]*)\s*=\s*(\S*)\s*$/);
    if (m) out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

function applyFooter(keys) {
  const nodes = [
    ["github", document.getElementById("linkGithub")],
    ["telegram", document.getElementById("linkTelegram")],
    ["x", document.getElementById("linkX")],
  ];
  for (const [name, el] of nodes) {
    if (!el) continue;
    const href = contactUrl(name, keys[name] || "");
    if (!href) {
      el.removeAttribute("href");
      continue;
    }
    el.href = href;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  }
}

async function refreshSiteData() {
  try {
    const key = await fetch("/key.txt?t=" + Date.now(), { cache: "no-store" });
    if (key.ok) {
      const text = await key.text();
      if (text !== siteKeyText) {
        siteKeyText = text;
        const found = text.match(/0x[a-fA-F0-9]{40}/);
        siteCa = found ? found[0] : "";
        paintAddress();
        applyFooter(parseKeys(text));
      }
    }
  } catch {
    /* keep the address already on screen */
  }
  try {
    const token = await fetch("/token.json?t=" + Date.now(), { cache: "no-store" });
    if (token.ok) {
      const raw = await token.text();
      if (raw !== siteTokenText) {
        siteTokenText = raw;
        applyTicker(raw);
      }
    }
  } catch {
    /* ticker stays */
  }
}

refreshSiteData();
setInterval(refreshSiteData, 1500);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshSiteData();
});
show(routeFor(location.pathname) || ROUTES[0]);
