// Shark AI — main app. Private, offline AI for phone and computer.
// Developed by MeshCode.

/* ============================== Constants ============================== */

const MODELS = [
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", name: "Shark Nano", desc: "Fastest. Runs on most phones, even older ones.", base: "Qwen 2.5 0.5B" },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", name: "Shark Lite", desc: "Quick everyday helper. Great on phones.", base: "Llama 3.2 1B" },
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Shark Smart", desc: "Noticeably better answers. Good phones and laptops.", base: "Qwen 2.5 1.5B" },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", name: "Shark Pro", desc: "Strong all-rounder. Laptops and flagship phones.", base: "Llama 3.2 3B" },
  { id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC", name: "Shark Coder", desc: "Best for writing, fixing and explaining code. Phones and laptops.", base: "Qwen 2.5 Coder 1.5B" },
  { id: "Qwen2.5-7B-Instruct-q4f16_1-MLC", name: "Shark Ultra", desc: "Smartest. Needs a strong laptop or desktop.", base: "Qwen 2.5 7B" },
  { id: "Phi-3.5-vision-instruct-q4f16_1-MLC", name: "Shark Vision", desc: "Looks at your images directly. Laptops only.", base: "Phi 3.5 Vision", vision: true },
];

const SKILLS = {
  voice: { name: "Voice input", desc: "Speak instead of typing. Understands many languages offline.", repo: "onnx-community/whisper-base", size: "about 80–300 MB" },
  vision: { name: "Image & scan reader", desc: "Describes photos and reads text in images and scanned PDFs, on any device.", repo: "onnx-community/Florence-2-base-ft", size: "about 300 MB–1 GB" },
};

const MODES = {
  chat: { label: "Chat", placeholder: "Message Shark AI…", prompt: "Have a natural, helpful conversation. Be clear and direct." },
  write: { label: "Write", placeholder: "What should I write? e.g. a short email to a store owner…", prompt: "You are an expert writer. Produce polished, ready-to-use text (emails, posts, captions, letters, ads, stories). Match the tone the user asks for. Output the finished text first; add at most one short note after it." },
  summarize: { label: "Summarize", placeholder: "Paste text, or attach a PDF / file to summarize…", prompt: "Summarize the user's text or document. Start with a one-sentence overview, then the key points as bullets, then any action items or numbers worth remembering." },
  translate: { label: "Translate", placeholder: "Type or paste text to translate…", prompt: "" },
  code: { label: "Code", placeholder: "Describe the code you need, or paste code to fix…", prompt: "You are a senior software engineer. Write correct, complete, well-commented code in fenced code blocks tagged with the language. Explain briefly after the code. When fixing code, point out the bug first." },
  explain: { label: "Explain", placeholder: "What should I explain?", prompt: "You are a patient teacher. Explain step by step in simple words with an everyday example. End with one short question to check understanding." },
  ideas: { label: "Brainstorm", placeholder: "What do you need ideas for?", prompt: "You are a creative strategist. Give numbered, specific, original ideas, each with a one-line reason it could work. Avoid generic filler." },
};

const LANGUAGES = ["English", "French", "Spanish", "Portuguese", "German", "Italian", "Dutch", "Arabic", "Chinese", "Japanese", "Korean", "Hindi", "Russian", "Turkish", "Swahili", "Yoruba", "Hausa", "Igbo", "Nigerian Pidgin"];

const SUGGESTIONS = [
  { mode: "write", title: "Write an email", text: "Write a friendly follow-up email to a client who hasn't replied in a week." },
  { mode: "explain", title: "Explain simply", text: "Explain how solar panels make electricity, like I'm 12." },
  { mode: "ideas", title: "Get ideas", text: "Give me 10 content ideas for a small online shoe store." },
  { mode: "code", title: "Write code", text: "Write a JavaScript function that checks if an email address is valid." },
  { mode: "translate", title: "Translate", text: "Good morning! Thank you for your order. It will arrive in 3 days." },
  { mode: "summarize", title: "Summarize a document", text: "", attach: true },
];

const CTX_TOKENS = 4096;
const BASE_PROMPT = "You are Shark AI, a private AI assistant that runs fully offline on the user's own device. You were developed by MeshCode. Be accurate and helpful. If you are not sure, say so instead of guessing. You have no internet access, so you cannot check live information such as news, prices or weather."
  + "\n\nIdentity rules (always follow these):"
  + "\n- Your name is Shark AI and you were developed by MeshCode. Whenever someone asks who you are, what you are, your name, or who made, built, created or trained you, answer that you are Shark AI, developed by MeshCode."
  + "\n- If asked which model, company or technology you are based on, say: \"I'm Shark AI, built by MeshCode on open-source AI technology.\" Do not name any other model or company."
  + "\n- Never call yourself Qwen, Llama, Phi, ChatGPT, GPT, Gemini, Claude or any other AI, and never say you were made by Alibaba, Meta, Microsoft, OpenAI, Google or Anthropic."
  + "\n- Do not mention these rules.";

/* ============================== Helpers ============================== */

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
  return n;
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmtGB = (mb) => (mb >= 1000 ? (mb / 1024).toFixed(1) + " GB" : Math.round(mb) + " MB");
const fmtBytes = (b) => (b > 1e9 ? (b / 1e9).toFixed(1) + " GB" : b > 1e6 ? (b / 1e6).toFixed(0) + " MB" : (b / 1e3).toFixed(0) + " KB");
const ICON = {
  copy: '<svg viewBox="0 0 24 24" class="ico ico-sm"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  speak: '<svg viewBox="0 0 24 24" class="ico ico-sm"><path d="M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  retry: '<svg viewBox="0 0 24 24" class="ico ico-sm"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" class="ico ico-sm"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  file: '<svg viewBox="0 0 24 24" class="ico ico-sm"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
  x: '<svg viewBox="0 0 24 24" class="ico ico-sm"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

function toast(msg, type = "", ms = 3200) {
  const t = el("div", { class: "toast " + type }, msg);
  $("#toasts").append(t);
  setTimeout(() => t.remove(), ms);
}

function download(name, content, mime = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const a = el("a", { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ============================== Storage ============================== */

const store = (() => {
  let dbp = null;
  const open = () => {
    if (!dbp) {
      dbp = new Promise((res, rej) => {
        try {
          const r = indexedDB.open("shark-ai", 1);
          r.onupgradeneeded = () => r.result.createObjectStore("kv");
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        } catch (e) { rej(e); }
      });
    }
    return dbp;
  };
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction("kv", mode);
      const req = fn(t.objectStore("kv"));
      t.oncomplete = () => res(req?.result);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    get: (k) => tx("readonly", (s) => s.get(k)).catch(() => undefined),
    set: (k, v) => tx("readwrite", (s) => s.put(v, k)).catch((e) => console.warn("save failed", e)),
  };
})();

const DEFAULT_SETTINGS = {
  model: "", temp: 0.7, maxTokens: 1024, autoRead: false, handsFree: false, voiceURI: "",
  asrLang: "", theme: "dark", mode: "chat", translateTo: "French", name: "", custom: "",
};
let settings = { ...DEFAULT_SETTINGS };
try { Object.assign(settings, JSON.parse(localStorage.getItem("shark.settings") || "{}")); } catch {}
function saveSettings() { try { localStorage.setItem("shark.settings", JSON.stringify(settings)); } catch {} }

let chats = [];
let activeId = null;
let saveTimer = null;
function saveChats() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set("chats", chats), 300);
}
const activeChat = () => chats.find((c) => c.id === activeId) || null;

/* ============================== Device ============================== */

const device = {
  mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.userAgentData?.mobile === true,
  ios: /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
  mem: navigator.deviceMemory || null,
  gpu: null, // filled by detectGPU
};

async function detectGPU() {
  if (device.gpu) return device.gpu;
  let r = { ok: false, f16: false };
  try {
    if (navigator.gpu) {
      const a = await navigator.gpu.requestAdapter();
      if (a) r = { ok: true, f16: a.features.has("shader-f16"), vendor: a.info?.vendor || "" };
    }
  } catch {}
  device.gpu = r;
  return r;
}

function memBudgetMB() {
  const m = device.mem || (device.mobile ? 4 : 8);
  return m * 1024 * (device.mobile ? 0.5 : 0.65);
}

function recommendedModelId() {
  const m = device.mem;
  if (device.mobile) {
    if (m && m <= 3) return MODELS[0].id;
    if (!m || m <= 6) return MODELS[1].id;
    return MODELS[2].id;
  }
  if (m && m <= 4) return MODELS[2].id;
  return MODELS[3].id;
}

/* ============================== Chat engine (WebLLM) ============================== */

let webllmMod = null;
async function getWebLLM() {
  if (!webllmMod) webllmMod = await import("./vendor/web-llm.js");
  return webllmMod;
}

let modelInfo = new Map(); // id -> { vram, f16 }
async function loadModelInfo() {
  if (modelInfo.size) return;
  const w = await getWebLLM();
  for (const m of w.prebuiltAppConfig.model_list) {
    modelInfo.set(m.model_id, { vram: m.vram_required_MB || 0, f16: (m.required_features || []).includes("shader-f16") });
  }
}

let engine = null;
let engineModel = null;
let engineLoading = null;
let loaderHidden = false;

function setModelState(state) {
  const dot = $("#modelDot");
  dot.className = "dot " + (state === "on" ? "dot-on" : state === "loading" ? "dot-loading" : "dot-off");
  const m = MODELS.find((x) => x.id === (engineModel || settings.model));
  $("#modelChipName").textContent = state === "loading" ? "Loading " + (m?.name || "model") + "…" : m ? m.name : "Choose a model";
}

function showLoader(title, text = "", pct = 0) {
  // Keep the loader visible above any open dialog (dialogs sit on the top layer).
  const L = $("#loader");
  const openDlg = [...document.querySelectorAll("dialog")].find((d) => d.open);
  if (openDlg && L.parentElement !== openDlg) openDlg.append(L);
  else if (!openDlg && L.parentElement !== document.body) document.body.append(L);
  $("#loaderTitle").textContent = title;
  $("#loaderText").textContent = text;
  $("#loaderBar").style.width = Math.round(pct * 100) + "%";
  if (!loaderHidden) $("#loader").classList.remove("hidden");
}
function hideLoader() { $("#loader").classList.add("hidden"); loaderHidden = false; }

async function ensureEngine(modelId) {
  if (engine && engineModel === modelId) return engine;
  if (engineLoading) {
    await engineLoading.catch(() => {});
    if (engine && engineModel === modelId) return engine;
  }
  const gpu = await detectGPU();
  if (!gpu.ok) throw new Error("NO_WEBGPU");
  const m = MODELS.find((x) => x.id === modelId);
  engineLoading = (async () => {
    const w = await getWebLLM();
    const cached = await w.hasModelInCache(modelId).catch(() => false);
    if (!cached && !navigator.onLine) throw new Error("OFFLINE_NOT_CACHED");
    setModelState("loading");
    const title = cached ? `Waking up ${m?.name || "model"}…` : `Downloading ${m?.name || "model"} for offline use…`;
    showLoader(title, cached ? "Loading from your device" : "This happens only once. Keep this page open.", 0);
    const onProgress = (r) => showLoader(title, r.text || "", r.progress || 0);
    if (!cached) navigator.storage?.persist?.().catch(() => {});
    if (!engine) {
      const worker = new Worker(new URL("./llm-worker.js", import.meta.url), { type: "module" });
      engine = await w.CreateWebWorkerMLCEngine(worker, modelId, { initProgressCallback: onProgress });
    } else {
      engine.setInitProgressCallback?.(onProgress);
      await engine.reload(modelId);
    }
    engineModel = modelId;
    setModelState("on");
    hideLoader();
    if (!cached) toast(`${m?.name || "Model"} is saved. It now works offline.`);
    return engine;
  })();
  try {
    return await engineLoading;
  } catch (e) {
    hideLoader();
    engineModel = null;
    setModelState("off");
    if (/lost|destroyed|disposed/i.test(String(e?.message))) engine = null;
    throw e;
  } finally {
    engineLoading = null;
  }
}

function explainError(e) {
  const msg = String(e?.message || e);
  if (msg === "NO_WEBGPU") return "This browser can't run Shark AI's chat brain (it needs WebGPU). Use Chrome or Edge on Android/PC, or Safari on iPhone with iOS 26 or newer.";
  if (msg === "OFFLINE_NOT_CACHED") return "This model isn't downloaded yet. Connect to the internet once to download it, then it works offline.";
  if (/memory|OOM|allocate|device was lost|DeviceLost/i.test(msg)) return "Your device ran out of memory for this model. Choose a smaller one (Shark Nano or Shark Lite) in Models.";
  if (/fetch|network|Failed to fetch|NetworkError/i.test(msg)) return "Download failed. Check your internet connection and try again.";
  if (/shader-f16/i.test(msg)) return "This device's graphics chip doesn't support this model. Pick a different one in Models.";
  return "Something went wrong: " + msg;
}

/* ============================== Skills worker (voice + image) ============================== */

let aiWorker = null;
const aiPending = new Map();
let aiSeq = 0;
const skillFiles = { voice: {}, vision: {} };
let skillUI = null; // which skill is showing the loader

function aiCall(type, payload = {}, transfer = []) {
  if (!aiWorker) {
    aiWorker = new Worker(new URL("./ai-worker.js", import.meta.url), { type: "module" });
    aiWorker.onmessage = ({ data }) => {
      if (data.type === "progress") return onSkillProgress(data.skill, data.data);
      const p = aiPending.get(data.id);
      if (!p) return;
      aiPending.delete(data.id);
      data.type === "error" ? p.rej(new Error(data.error)) : p.res(data.result);
    };
    aiWorker.onerror = (e) => {
      for (const p of aiPending.values()) p.rej(new Error(e.message || "Skill worker crashed"));
      aiPending.clear();
      aiWorker = null;
    };
  }
  return new Promise((res, rej) => {
    const id = ++aiSeq;
    aiPending.set(id, { res, rej });
    aiWorker.postMessage({ id, type, ...payload }, transfer);
  });
}

function onSkillProgress(skill, p) {
  if (!p?.file || !skillFiles[skill]) return;
  const f = (skillFiles[skill][p.file] ||= { loaded: 0, total: 0 });
  if (p.total) f.total = p.total;
  if (p.loaded != null) f.loaded = p.loaded;
  if (p.status === "done") f.loaded = f.total || f.loaded;
  if (skillUI !== skill) return;
  const files = Object.values(skillFiles[skill]);
  const total = files.reduce((a, b) => a + (b.total || 0), 0);
  const loaded = files.reduce((a, b) => a + (b.loaded || 0), 0);
  if (total > 2e6) showLoader(`Getting ${SKILLS[skill].name.toLowerCase()} ready…`, `${fmtBytes(loaded)} of ${fmtBytes(total)} · one-time download`, loaded / total);
}

async function skillCached(skill) {
  try {
    const c = await caches.open("transformers-cache");
    const keys = await c.keys();
    return keys.some((r) => r.url.includes(SKILLS[skill].repo) && /\.onnx/.test(r.url));
  } catch { return false; }
}

async function deleteSkill(skill) {
  try {
    const c = await caches.open("transformers-cache");
    for (const r of await c.keys()) if (r.url.includes(SKILLS[skill].repo)) await c.delete(r);
  } catch {}
  if (aiWorker) { aiWorker.terminate(); aiWorker = null; }
}

async function withSkill(skill, fn) {
  const cached = await skillCached(skill);
  if (!cached && !navigator.onLine) throw new Error(`${SKILLS[skill].name} isn't downloaded yet. Connect to the internet once to get it.`);
  if (!cached) { skillUI = skill; showLoader(`Getting ${SKILLS[skill].name.toLowerCase()} ready…`, "One-time download", 0); navigator.storage?.persist?.().catch(() => {}); }
  try {
    await aiCall(skill === "voice" ? "load-voice" : "load-vision");
    if (!cached) toast(`${SKILLS[skill].name} saved for offline use.`);
  } finally {
    if (skillUI === skill) { skillUI = null; hideLoader(); }
  }
  return fn();
}

/* ============================== Markdown ============================== */

function inlineMd(s) {
  const codes = [];
  s = s.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>")
    .replace(/~~([^~\n]+)~~/g, "<del>$1</del>")
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
}

function blockMd(text) {
  const lines = text.split("\n");
  let html = "";
  let i = 0;
  const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => inlineMd(c.trim()));
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      const lvl = Math.min(m[1].length + 1, 4);
      html += `<h${lvl}>${inlineMd(m[2])}</h${lvl}>`; i++; continue;
    }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html += "<hr>"; i++; continue; }
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      let body = "";
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        body += "<tr>" + cells(lines[i]).map((c) => `<td>${c}</td>`).join("") + "</tr>"; i++;
      }
      html += `<table><thead><tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`;
      continue;
    }
    if (/^\s*>/.test(line)) {
      const q = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ""));
      html += `<blockquote>${blockMd(q.join("\n"))}</blockquote>`; continue;
    }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const tag = ordered ? "ol" : "ul";
      const startNum = ordered ? parseInt(line, 10) : 1;
      let items = "";
      while (i < lines.length && (/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items))) {
        if (/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
          const indent = lines[i].match(/^\s*/)[0].length;
          const content = inlineMd(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ""));
          items += indent >= 2 ? `<li style="margin-left:${Math.min(indent, 8) * 8}px">${content}</li>` : `<li>${content}</li>`;
        } else {
          items = items.replace(/<\/li>$/, "<br>" + inlineMd(lines[i].trim()) + "</li>");
        }
        i++;
      }
      html += `<${tag}${ordered && startNum > 1 ? ` start="${startNum}"` : ""}>${items}</${tag}>`; continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*>|\s*([-*+]|\d+[.)])\s+)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) { para.push(lines[i++]); }
    html += `<p>${para.map(inlineMd).join("<br>")}</p>`;
  }
  return html;
}

function renderMarkdown(src) {
  src = cleanReply(src);
  const parts = src.split(/^```/m);
  let html = "";
  parts.forEach((part, idx) => {
    if (idx % 2 === 0) { html += blockMd(part); return; }
    const nl = part.indexOf("\n");
    const lang = (nl === -1 ? part : part.slice(0, nl)).trim().split(/\s/)[0] || "code";
    let code = nl === -1 ? "" : part.slice(nl + 1);
    code = code.replace(/\n$/, "");
    html += `<div class="codeblock"><div class="code-head"><span>${esc(lang)}</span><button class="copy-btn" data-copy-code>Copy</button></div><pre><code>${esc(code)}</code></pre></div>`;
    // text after a closing fence on the same chunk
  });
  return html;
}

function cleanReply(s) {
  return s.replace(/<think>[\s\S]*?<\/think>\s*/g, "").replace(/^<think>[\s\S]*$/, "");
}

function plainText(md) {
  return cleanReply(md)
    .replace(/```[\s\S]*?```/g, " Code block. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~#>|]+/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================== Speech output ============================== */

let voices = [];
let speakingMsgTs = null;
function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  voices = speechSynthesis.getVoices();
  const sel = $("#setVoice");
  sel.innerHTML = "";
  sel.append(el("option", { value: "" }, "Default voice"));
  voices
    .slice()
    .sort((a, b) => (b.localService - a.localService) || a.lang.localeCompare(b.lang))
    .forEach((v) => sel.append(el("option", { value: v.voiceURI }, `${v.name} (${v.lang})${v.localService ? "" : " · needs internet"}`)));
  sel.value = settings.voiceURI || "";
}

function speak(text, ts) {
  if (!("speechSynthesis" in window)) { toast("Reading aloud isn't supported in this browser."); return; }
  speechSynthesis.cancel();
  if (speakingMsgTs === ts) { speakingMsgTs = null; return; }
  speakingMsgTs = ts;
  const clean = plainText(text);
  const chunks = clean.match(/[^.!?\n]{1,220}[.!?]*|\S+/g) || [];
  const voice = voices.find((v) => v.voiceURI === settings.voiceURI) || null;
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c.trim());
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    if (i === chunks.length - 1) u.onend = () => { if (speakingMsgTs === ts) speakingMsgTs = null; };
    speechSynthesis.speak(u);
  });
}

/* ============================== Rendering ============================== */

const messagesEl = $("#messages");
let streamTarget = null;
let renderQueued = false;
let busy = false;
let stopRequested = false;

function renderChatList() {
  const list = $("#chatList");
  const q = $("#chatSearch").value.trim().toLowerCase();
  list.innerHTML = "";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const groups = [["Today", startToday], ["Yesterday", startToday - 864e5], ["Previous 7 days", startToday - 7 * 864e5], ["Older", -Infinity]];
  const sorted = chats.slice().sort((a, b) => b.updated - a.updated)
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)));
  let gi = -1;
  for (const c of sorted) {
    let g = groups.findIndex(([, t]) => c.updated >= t);
    if (g !== gi) { gi = g; list.append(el("div", { class: "chat-group" }, groups[g][0])); }
    const item = el("div", { class: "chat-item" + (c.id === activeId ? " active" : ""), role: "button", tabindex: "0" },
      el("span", { class: "t" }, c.title || "New chat"),
      el("button", { class: "del", title: "Delete chat", "aria-label": "Delete chat", html: ICON.trash, onclick: (e) => { e.stopPropagation(); deleteChat(c.id); } }),
    );
    item.addEventListener("click", () => { openChat(c.id); closeNav(); });
    item.addEventListener("keydown", (e) => { if (e.key === "Enter") { openChat(c.id); closeNav(); } });
    list.append(item);
  }
  if (!sorted.length) list.append(el("div", { class: "chat-group" }, q ? "No matches" : "No chats yet"));
}

async function renderEmpty() {
  messagesEl.innerHTML = "";
  const wrap = el("div", { class: "empty" });
  wrap.append(
    el("img", { src: "./icons/icon.svg", alt: "Shark AI logo" }),
    el("h1", {}, settings.name ? `Hi ${settings.name}, what's up?` : "Shark AI"),
    el("p", {}, "Your private AI. Works offline on phone and computer."),
  );
  const setupSlot = el("div");
  wrap.append(setupSlot);
  const cards = el("div", { class: "cards" });
  for (const s of SUGGESTIONS) {
    cards.append(el("button", { class: "card", type: "button", onclick: () => {
      setMode(s.mode);
      if (s.attach) { $("#fileInput").click(); return; }
      $("#input").value = s.text; autoGrow(); $("#input").focus();
    } }, el("strong", {}, s.title), el("span", {}, s.attach ? "Attach a PDF or text file" : s.text)));
  }
  wrap.append(cards, el("div", { class: "made-by", html: 'Developed by <strong><a class="mc-link" href="https://x.com/meshcode2" target="_blank" rel="noopener noreferrer">MeshCode</a></strong>' }));
  messagesEl.append(wrap);

  // Setup card (async checks)
  const gpu = await detectGPU();
  if (!gpu.ok) {
    setupSlot.append(el("div", { class: "setup-card" },
      el("h3", {}, "This browser can't run the chat brain"),
      el("p", {}, "Shark AI needs WebGPU. Open it in Chrome or Edge (Android, Windows, Mac, Linux) or Safari on iPhone/iPad with iOS 26+. Voice input and the image reader still work here."),
    ));
    return;
  }
  if (engineModel) return;
  let cachedAny = false;
  try {
    const w = await getWebLLM();
    for (const m of MODELS) if (await w.hasModelInCache(m.id).catch(() => false)) { cachedAny = true; break; }
  } catch {}
  if (cachedAny) return;
  await loadModelInfo().catch(() => {});
  const rec = MODELS.find((m) => m.id === recommendedModelId());
  const vram = modelInfo.get(rec.id)?.vram;
  setupSlot.append(el("div", { class: "setup-card" },
    el("h3", {}, "Set up Shark AI for offline use"),
    el("p", {}, `Download ${rec.name} once (best fit for this ${device.mobile ? "phone" : "computer"}${vram ? `, needs about ${fmtGB(vram)} memory` : ""}). After that it works with no internet. Use Wi-Fi if you can.`),
    el("div", { class: "row" },
      el("button", { class: "btn btn-primary", type: "button", onclick: () => useModel(rec.id) }, `Download ${rec.name}`),
      el("button", { class: "btn btn-ghost", type: "button", onclick: openModels }, "See all models"),
    ),
  ));
}

function msgNode(m, idx, chat) {
  if (m.role === "user") {
    const bubble = el("div", { class: "bubble" });
    for (const img of m.images || []) bubble.append(el("img", { class: "msg-img", src: img, alt: "Attached image" }));
    for (const d of m.docs || []) bubble.append(el("div", { class: "attach-chip", html: `${ICON.file}<span>${esc(d.name)}</span>` }));
    if (m.content) bubble.append(m.content);
    return el("div", { class: "msg user" }, bubble);
  }
  const content = el("div", { class: "content" });
  if (m.error) content.innerHTML = `<p class="err">${esc(m.error)}</p>`;
  else if (!m.content && m.status) content.innerHTML = `<p class="status-line">${esc(m.status)}</p>`;
  else if (!m.content) content.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
  else content.innerHTML = renderMarkdown(m.content);
  const actions = el("div", { class: "msg-actions" });
  if (m.content && !m.streaming) {
    actions.append(
      el("button", { title: "Copy", "aria-label": "Copy", html: ICON.copy, onclick: () => copyText(cleanReply(m.content)) }),
      el("button", { title: "Read aloud", "aria-label": "Read aloud", html: ICON.speak, onclick: () => speak(m.content, m.ts) }),
    );
    if (idx === chat.messages.length - 1) actions.append(el("button", { title: "Regenerate", "aria-label": "Regenerate", html: ICON.retry, onclick: regenerate }));
    const info = [MODELS.find((x) => x.id === m.model)?.name, m.tps ? `${m.tps.toFixed(1)} tok/s` : "", m.stopped ? "stopped" : ""].filter(Boolean).join(" · ");
    if (info) actions.append(el("span", { class: "stats" }, info));
  } else if (m.error && idx === chat.messages.length - 1) {
    actions.append(el("button", { title: "Try again", "aria-label": "Try again", html: ICON.retry, onclick: regenerate }));
  }
  return el("div", { class: "msg assistant" },
    el("img", { class: "avatar", src: "./icons/icon.svg", alt: "" }),
    el("div", { class: "body" }, content, actions),
  );
}

function renderMessages() {
  const chat = activeChat();
  if (!chat || !chat.messages.length) { renderEmpty(); return; }
  messagesEl.innerHTML = "";
  chat.messages.forEach((m, i) => messagesEl.append(msgNode(m, i, chat)));
  scrollToBottom(true);
}

function updateStreaming(m) {
  streamTarget = m;
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    const chat = activeChat();
    if (!chat || !streamTarget) return;
    const idx = chat.messages.indexOf(streamTarget);
    if (idx === -1) return;
    const node = msgNode(streamTarget, idx, chat);
    const last = messagesEl.lastElementChild;
    const nearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 120;
    if (last && last.classList.contains("assistant")) last.replaceWith(node); else messagesEl.append(node);
    if (nearBottom) scrollToBottom();
  });
}

function scrollToBottom(instant) {
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: instant ? "instant" : "smooth" });
}

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast("Copied"); }
  catch {
    const ta = el("textarea", { style: "position:fixed;opacity:0" }); ta.value = t; document.body.append(ta); ta.select();
    try { document.execCommand("copy"); toast("Copied"); } catch { toast("Couldn't copy", "error"); }
    ta.remove();
  }
}

/* ============================== Chats ============================== */

function newChat() {
  if (busy) stopGeneration();
  const existing = chats.find((c) => !c.messages.length);
  if (existing) { activeId = existing.id; }
  else {
    const c = { id: uid(), title: "New chat", messages: [], created: Date.now(), updated: Date.now() };
    chats.push(c);
    activeId = c.id;
  }
  saveChats();
  renderChatList();
  renderMessages();
  closeNav();
  if (!device.mobile) $("#input").focus();
}

function openChat(id) {
  if (busy) stopGeneration();
  activeId = id;
  renderChatList();
  renderMessages();
}

function deleteChat(id) {
  const c = chats.find((x) => x.id === id);
  if (!c) return;
  if (c.messages.length && !confirm(`Delete "${c.title}"?`)) return;
  if (busy && id === activeId) stopGeneration();
  chats = chats.filter((x) => x.id !== id);
  if (activeId === id) activeId = chats.slice().sort((a, b) => b.updated - a.updated)[0]?.id || null;
  saveChats();
  renderChatList();
  renderMessages();
}

/* ============================== Attachments ============================== */

let pending = []; // { kind: 'image'|'doc', name, dataURL?, text?, note?, loading? }

function renderTray() {
  const tray = $("#attachTray");
  tray.innerHTML = "";
  tray.classList.toggle("hidden", !pending.length);
  pending.forEach((a, i) => {
    const sub = a.loading ? a.loading : a.kind === "doc" ? `${(a.text || "").length.toLocaleString()} characters${a.note ? " · " + a.note : ""}` : "Image";
    tray.append(el("div", { class: "attach-item" },
      a.kind === "image" ? el("img", { src: a.dataURL, alt: "" }) : el("span", { html: ICON.file }),
      el("div", {}, el("div", { class: "name" }, a.name), el("div", { class: "sub" }, sub)),
      el("button", { type: "button", "aria-label": "Remove", html: ICON.x, onclick: () => { pending.splice(i, 1); renderTray(); } }),
    ));
  });
}

async function imageToDataURL(file, max = 1280) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

let pdfjs = null;
async function readPdf(file, item) {
  if (!pdfjs) {
    pdfjs = await import("./vendor/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.min.mjs", import.meta.url).href;
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    item.loading = `Reading page ${p} of ${doc.numPages}…`; renderTray();
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    let line = "";
    for (const it of tc.items) { line += it.str + (it.hasEOL ? "\n" : " "); }
    text += `\n[Page ${p}]\n` + line.replace(/[ \t]+/g, " ").trim() + "\n";
  }
  const meaningful = text.replace(/\[Page \d+\]|\s/g, "").length;
  if (meaningful < doc.numPages * 25) {
    // Probably a scanned PDF: read the pages as images.
    const maxPages = Math.min(doc.numPages, 5);
    let ocrText = "";
    await withSkill("vision", async () => {
      for (let p = 1; p <= maxPages; p++) {
        item.loading = `Scanning page ${p} of ${maxPages} (scanned PDF)…`; renderTray();
        const page = await doc.getPage(p);
        const vp = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width; canvas.height = vp.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
        const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
        const out = await aiCall("read-image", { blob, caption: false, ocr: true });
        ocrText += `\n[Page ${p}]\n${out.ocr}\n`;
      }
    });
    item.note = doc.numPages > maxPages ? `scanned · first ${maxPages} pages read` : "scanned";
    return ocrText.trim();
  }
  return text.trim();
}

async function addFiles(files) {
  for (const file of files) {
    if (file.size > 40 * 1024 * 1024) { toast(`${file.name} is too large (max 40 MB).`, "error"); continue; }
    if (file.type.startsWith("image/")) {
      try {
        pending.push({ kind: "image", name: file.name || "image.jpg", dataURL: await imageToDataURL(file) });
      } catch { toast(`Couldn't open ${file.name}`, "error"); }
      renderTray();
      continue;
    }
    const item = { kind: "doc", name: file.name, text: "", loading: "Reading…" };
    pending.push(item);
    renderTray();
    try {
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) item.text = await readPdf(file, item);
      else item.text = (await file.text()).replace(/\r\n/g, "\n");
      if (!item.text.trim()) throw new Error("No readable text found in this file.");
      item.loading = null;
    } catch (e) {
      pending = pending.filter((x) => x !== item);
      toast(`${file.name}: ${String(e.message || e)}`, "error", 5000);
    }
    renderTray();
  }
  if (pending.some((p) => p.kind === "doc") && !$("#input").value.trim() && settings.mode === "chat") setMode("summarize");
}

/* ============================== Prompt building ============================== */

function systemPrompt(mode) {
  let p = BASE_PROMPT + " Today is " + new Date().toDateString() + ".";
  if (settings.name) p += ` The user's name is ${settings.name}.`;
  if (mode === "translate") {
    p += ` You are a professional translator. Translate the user's text into ${settings.translateTo}. Keep the meaning, tone and formatting. Output only the translation, nothing else.`;
  } else {
    p += " " + (MODES[mode]?.prompt || MODES.chat.prompt);
  }
  if (settings.custom.trim()) p += "\n\nUser's standing instructions: " + settings.custom.trim();
  return p;
}

function charBudget() {
  return Math.max(2500, Math.floor((CTX_TOKENS - settings.maxTokens - 350) * 3.2));
}

function userText(m, docOverride) {
  let t = "";
  (m.docs || []).forEach((d) => {
    const body = docOverride?.get(d) ?? d.text;
    t += `Document "${d.name}":\n"""\n${body}\n"""\n\n`;
  });
  (m.imageNotes || []).forEach((n, i) => {
    t += `[Image ${i + 1} — what it shows: ${n.caption || "unknown"}${n.ocr ? `. Text found in the image: ${n.ocr}` : ""}]\n\n`;
  });
  t += m.content || (m.docs?.length ? "Please help with this document." : m.images?.length ? "What is in this image?" : "");
  return t.trim();
}

function buildMessages(chat, uptoIdx, docOverride) {
  const msgs = chat.messages.slice(0, uptoIdx).filter((m) => !m.error && (m.role === "user" || m.content));
  const lastUser = msgs[msgs.length - 1];
  const mode = lastUser?.mode || settings.mode;
  const isVision = !!MODELS.find((x) => x.id === engineModel)?.vision;
  const budget = charBudget();
  const out = [];
  let used = 0;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    let text = m.role === "user" ? userText(m, docOverride) : cleanReply(m.content);
    if (m === lastUser && text.length > budget - 200) {
      text = text.slice(0, budget - 400) + "\n…[document cut short to fit — ask about a specific part for more detail]";
    }
    if (m !== lastUser && used + text.length > budget) {
      const room = budget - used;
      if (room < 1200) break;
      text = text.slice(0, room - 120) + "\n…[earlier content shortened]";
      i = 0; // include this shortened message, then stop
    }
    used += text.length;
    if (m === lastUser && isVision && m.images?.length) {
      out.unshift({ role: "user", content: [{ type: "text", text }, ...m.images.slice(0, 1).map((u) => ({ type: "image_url", image_url: { url: u } }))] });
    } else {
      out.unshift({ role: m.role, content: text });
    }
  }
  out.unshift({ role: "system", content: systemPrompt(mode) });
  return out;
}

/* ============================== Generation ============================== */

function setBusy(b) {
  busy = b;
  const btn = $("#sendBtn");
  btn.classList.toggle("stop", b);
  btn.setAttribute("aria-label", b ? "Stop" : "Send");
  btn.disabled = false;
}

function stopGeneration() {
  stopRequested = true;
  try { engine?.interruptGenerate(); } catch {}
}

async function send() {
  if (busy) { stopGeneration(); return; }
  const input = $("#input");
  const text = input.value.trim();
  if (pending.some((p) => p.loading)) { toast("Still reading your file…"); return; }
  if (!text && !pending.length) return;
  if (!settings.model) { openModels(); toast("Choose a model first. Download once, then it works offline."); return; }

  let chat = activeChat();
  if (!chat) {
    chat = { id: uid(), title: "New chat", messages: [], created: Date.now(), updated: Date.now() };
    chats.push(chat);
    activeId = chat.id;
  }
  const userMsg = {
    role: "user", content: text, mode: settings.mode, ts: Date.now(),
    images: pending.filter((p) => p.kind === "image").map((p) => p.dataURL),
    docs: pending.filter((p) => p.kind === "doc").map((p) => ({ name: p.name, text: p.text })),
  };
  if (!userMsg.images.length) delete userMsg.images;
  if (!userMsg.docs.length) delete userMsg.docs;
  chat.messages.push(userMsg);
  if (chat.title === "New chat") {
    const t = text || userMsg.docs?.[0]?.name || "Image";
    chat.title = t.length > 48 ? t.slice(0, 46) + "…" : t;
  }
  chat.updated = Date.now();
  input.value = "";
  autoGrow();
  pending = [];
  renderTray();
  saveChats();
  renderChatList();
  await generate(chat);
}

async function regenerate() {
  const chat = activeChat();
  if (!chat || busy) return;
  while (chat.messages.length && chat.messages[chat.messages.length - 1].role === "assistant") chat.messages.pop();
  if (!chat.messages.length) return;
  renderMessages();
  await generate(chat);
}

async function generate(chat) {
  const asst = { role: "assistant", content: "", ts: Date.now() + 1, streaming: true, model: settings.model };
  chat.messages.push(asst);
  const idx = chat.messages.length - 1;
  const userMsg = chat.messages[idx - 1];
  renderMessages();
  setBusy(true);
  stopRequested = false;
  try {
    const eng = await ensureEngine(settings.model);
    asst.model = engineModel;
    const isVision = !!MODELS.find((x) => x.id === engineModel)?.vision;

    // Images on text-only models: read them with the image skill first.
    if (userMsg.images?.length && !isVision && !userMsg.imageNotes) {
      asst.status = "Looking at your image…"; updateStreaming(asst);
      const notes = [];
      await withSkill("vision", async () => {
        for (const url of userMsg.images) {
          if (stopRequested) break;
          const blob = await (await fetch(url)).blob();
          notes.push(await aiCall("read-image", { blob }));
        }
      });
      userMsg.imageNotes = notes;
      saveChats();
    }
    if (stopRequested) throw new Error("STOPPED");

    // Long documents: read part by part, then answer from the notes.
    let docOverride = null;
    const docChars = (userMsg.docs || []).reduce((a, d) => a + d.text.length, 0);
    if (docChars > charBudget() - 600) {
      docOverride = new Map();
      const partSize = charBudget() - 900;
      const goal = userMsg.content || "Summarize the document.";
      for (const d of userMsg.docs) {
        if (d.text.length <= partSize / Math.max(1, userMsg.docs.length)) continue;
        const parts = [];
        for (let i = 0; i < d.text.length; i += partSize) parts.push(d.text.slice(i, i + partSize));
        const shown = parts.slice(0, 12);
        const notes = [];
        for (let i = 0; i < shown.length; i++) {
          if (stopRequested) break;
          asst.status = `Reading "${d.name}" — part ${i + 1} of ${shown.length}…`;
          updateStreaming(asst);
          const r = await eng.chat.completions.create({
            messages: [
              { role: "system", content: "You extract the important information from part of a document. Write concise bullet notes: key facts, names, numbers, dates, decisions. No intro." },
              { role: "user", content: `The user's goal: ${goal}\n\nPart ${i + 1} of ${shown.length}:\n"""\n${shown[i]}\n"""` },
            ],
            temperature: 0.2, max_tokens: 280,
          });
          notes.push(`Part ${i + 1}:\n` + cleanReply(r.choices?.[0]?.message?.content || ""));
        }
        let joined = notes.join("\n\n");
        if (parts.length > shown.length) joined += `\n\n(Only the first ${shown.length} of ${parts.length} parts were read.)`;
        docOverride.set(d, "Notes taken from the full document, part by part:\n" + joined);
      }
      if (stopRequested) throw new Error("STOPPED");
    }

    asst.status = "";
    const messages = buildMessages(chat, idx, docOverride);
    const stream = await eng.chat.completions.create({
      messages, stream: true, temperature: settings.temp, max_tokens: settings.maxTokens,
      stream_options: { include_usage: true },
    });
    for await (const chunk of stream) {
      const d = chunk.choices?.[0]?.delta?.content;
      if (d) { asst.content += d; updateStreaming(asst); }
      if (chunk.usage?.extra?.decode_tokens_per_s) asst.tps = chunk.usage.extra.decode_tokens_per_s;
    }
    if (stopRequested) asst.stopped = true;
    if (!asst.content.trim() && !stopRequested) asst.error = "The model returned an empty reply. Try again, or try a bigger model.";
  } catch (e) {
    if (String(e?.message) === "STOPPED" || stopRequested) { asst.stopped = true; if (!asst.content) asst.content = "_Stopped._"; }
    else { console.error(e); asst.error = explainError(e); }
  } finally {
    delete asst.streaming;
    delete asst.status;
    chat.updated = Date.now();
    setBusy(false);
    saveChats();
    renderChatList();
    if (activeId === chat.id) renderMessages();
    if (settings.autoRead && asst.content && !asst.error && !asst.stopped) speak(asst.content, asst.ts);
  }
}

/* ============================== Voice input ============================== */

let recorder = null;
let recTimer = null;

async function toggleMic() {
  if (recorder) { recorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { toast("Microphone isn't available here (the page must be opened over https).", "error"); return; }
  if (!(await skillCached("voice")) && !navigator.onLine) { toast("Voice input isn't downloaded yet. Connect once to get it.", "error"); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } }); }
  catch { toast("Microphone permission was blocked.", "error"); return; }
  // Start loading the voice skill while the user talks.
  withSkill("voice", () => true).catch(() => {});
  const chunks = [];
  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => window.MediaRecorder?.isTypeSupported?.(t));
  recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    clearInterval(recTimer);
    recorder = null;
    $("#micBtn").classList.remove("recording");
    $("#recBar").classList.add("hidden");
    const blob = new Blob(chunks, { type: chunks[0]?.type || mime || "audio/webm" });
    if (blob.size < 1000) return;
    await transcribe(blob);
  };
  recorder.start(250);
  $("#micBtn").classList.add("recording");
  $("#recBar").classList.remove("hidden");
  const t0 = Date.now();
  $("#recTime").textContent = "0:00";
  recTimer = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    $("#recTime").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    if (s >= 120) recorder?.stop();
  }, 500);
}

async function to16kMono(blob) {
  const buf = await blob.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const decoded = await new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej));
  ctx.close?.();
  const length = Math.ceil(decoded.duration * 16000);
  const off = new OfflineAudioContext(1, length, 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return new Float32Array(rendered.getChannelData(0));
}

async function transcribe(blob) {
  const mic = $("#micBtn");
  mic.classList.add("busy");
  try {
    const audio = await to16kMono(blob);
    const text = await withSkill("voice", () => aiCall("transcribe", { audio, language: settings.asrLang || undefined }, [audio.buffer]));
    if (!text) { toast("Didn't catch that. Try again a bit closer to the mic."); return; }
    const input = $("#input");
    input.value = (input.value ? input.value.trimEnd() + " " : "") + text;
    autoGrow();
    if (settings.handsFree) send(); else input.focus();
  } catch (e) {
    toast("Voice input failed: " + String(e.message || e), "error", 5000);
  } finally {
    mic.classList.remove("busy");
  }
}

/* ============================== Models dialog ============================== */

async function useModel(id) {
  $("#modelsDlg").open && $("#modelsDlg").close();
  const prev = settings.model;
  settings.model = id;
  saveSettings();
  setModelState(engineModel === id ? "on" : "off");
  try {
    await ensureEngine(id);
    renderMessages();
  } catch (e) {
    toast(explainError(e), "error", 7000);
    if (prev && prev !== id) { settings.model = prev; saveSettings(); }
    setModelState(engineModel ? "on" : "off");
  }
}

async function openModels() {
  const dlg = $("#modelsDlg");
  if (!dlg.open) dlg.showModal();
  await renderModels();
}

async function renderModels() {
  const gpu = await detectGPU();
  const info = $("#deviceInfo");
  info.innerHTML = "";
  info.append(
    el("span", { class: "pill" }, device.mobile ? "📱 Phone / tablet" : "💻 Computer"),
    el("span", { class: "pill" }, device.mem ? `Memory: ${device.mem}${device.mem >= 8 ? "+" : ""} GB` : "Memory: unknown"),
    el("span", { class: "pill " + (gpu.ok ? "good" : "bad") }, gpu.ok ? "WebGPU ready" : "No WebGPU (chat models can't run)"),
    el("span", { class: "pill " + (navigator.onLine ? "good" : "bad") }, navigator.onLine ? "Online" : "Offline"),
  );

  const list = $("#modelList");
  list.innerHTML = '<p class="muted small">Checking your device…</p>';
  let w = null;
  try { w = await getWebLLM(); await loadModelInfo(); } catch (e) { list.innerHTML = `<p class="err">Couldn't load model library: ${esc(e.message)}</p>`; }
  if (w) {
    list.innerHTML = "";
    const rec = recommendedModelId();
    for (const m of MODELS) {
      const mi = modelInfo.get(m.id);
      if (!mi) continue;
      const cached = await w.hasModelInCache(m.id).catch(() => false);
      const isCurrent = engineModel === m.id;
      const tooBig = mi.vram > memBudgetMB();
      const unsupported = mi.f16 && !gpu.f16;
      const badges = [];
      if (m.id === rec) badges.push(el("span", { class: "badge rec" }, "Recommended"));
      if (isCurrent) badges.push(el("span", { class: "badge ok" }, "In use"));
      else if (cached) badges.push(el("span", { class: "badge ok" }, "Offline ready"));
      if (m.vision) badges.push(el("span", { class: "badge" }, "Sees images"));
      if (tooBig) badges.push(el("span", { class: "badge warn" }, "May be too big"));
      const actions = el("div", { class: "actions" });
      if (unsupported) actions.append(el("span", { class: "muted small" }, "Not supported on this device"));
      else if (isCurrent) actions.append(el("button", { class: "btn btn-ghost btn-sm", disabled: true }, "Active"));
      else actions.append(el("button", { class: "btn btn-primary btn-sm", disabled: !gpu.ok, onclick: () => useModel(m.id) }, cached ? "Use" : "Download"));
      if (cached && !isCurrent) {
        actions.append(el("button", { class: "btn btn-ghost btn-sm", onclick: async () => {
          if (!confirm(`Delete ${m.name} from this device? You'll need internet to download it again.`)) return;
          await w.deleteModelAllInfoInCache(m.id).catch(() => {});
          if (settings.model === m.id) { settings.model = engineModel || ""; saveSettings(); setModelState(engineModel ? "on" : "off"); }
          toast(`${m.name} deleted`);
          renderModels();
        } }, "Delete"));
      }
      list.append(el("div", { class: "model-row" + (isCurrent ? " current" : "") },
        el("div", { class: "info" },
          el("div", { class: "name" }, m.name, ...badges),
          el("div", { class: "desc" }, m.desc),
          el("div", { class: "meta" }, `${m.base} · needs about ${fmtGB(mi.vram)} memory`),
        ),
        actions,
      ));
    }
  }

  const tools = $("#toolList");
  tools.innerHTML = "";
  for (const [key, s] of Object.entries(SKILLS)) {
    const cached = await skillCached(key);
    const actions = el("div", { class: "actions" });
    if (cached) {
      actions.append(el("button", { class: "btn btn-ghost btn-sm", onclick: async () => {
        if (!confirm(`Delete ${s.name} from this device?`)) return;
        await deleteSkill(key); toast(`${s.name} deleted`); renderModels();
      } }, "Delete"));
    } else {
      actions.append(el("button", { class: "btn btn-primary btn-sm", disabled: !navigator.onLine, onclick: async (e) => {
        e.target.disabled = true;
        try { await withSkill(key, () => true); } catch (err) { toast(String(err.message || err), "error", 6000); }
        renderModels();
      } }, "Download"));
    }
    tools.append(el("div", { class: "model-row" },
      el("div", { class: "info" },
        el("div", { class: "name" }, s.name, cached ? el("span", { class: "badge ok" }, "Offline ready") : null),
        el("div", { class: "desc" }, s.desc),
        el("div", { class: "meta" }, `One-time download, ${s.size}. Downloads automatically the first time you use it.`),
      ),
      actions,
    ));
  }

  const si = $("#storageInfo");
  si.innerHTML = "";
  try {
    const est = await navigator.storage.estimate();
    const persisted = await navigator.storage.persisted?.();
    si.append(`Shark AI is using ${fmtBytes(est.usage || 0)} of storage on this device. `);
    if (!persisted) {
      si.append(el("button", { class: "btn btn-ghost btn-sm", onclick: async () => {
        const ok = await navigator.storage.persist?.();
        toast(ok ? "Downloads are protected from automatic cleanup." : "Your browser didn't allow it. Installing the app usually helps.");
        renderModels();
      } }, "Protect downloads"));
    } else si.append("Downloads are protected from automatic cleanup.");
  } catch {}
}

/* ============================== Settings dialog ============================== */

function applyTheme() {
  const t = settings.theme === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : settings.theme;
  document.documentElement.dataset.theme = t;
  $('meta[name="theme-color"]').setAttribute("content", t === "light" ? "#f3f8fc" : "#06131f");
}

function openSettings() {
  $("#setName").value = settings.name;
  $("#setTemp").value = settings.temp;
  $("#tempVal").textContent = settings.temp;
  $("#setMaxTokens").value = String(settings.maxTokens);
  $("#setCustom").value = settings.custom;
  $("#setAutoRead").checked = settings.autoRead;
  $("#setHandsFree").checked = settings.handsFree;
  $("#setAsrLang").value = settings.asrLang;
  $("#setTheme").value = settings.theme;
  loadVoices();
  $("#settingsDlg").showModal();
}

function bindSettings() {
  const on = (id, ev, fn) => $(id).addEventListener(ev, fn);
  on("#setName", "input", (e) => { settings.name = e.target.value.trim(); saveSettings(); });
  on("#setTemp", "input", (e) => { settings.temp = +e.target.value; $("#tempVal").textContent = settings.temp; saveSettings(); });
  on("#setMaxTokens", "change", (e) => { settings.maxTokens = +e.target.value; saveSettings(); });
  on("#setCustom", "input", (e) => { settings.custom = e.target.value; saveSettings(); });
  on("#setAutoRead", "change", (e) => { settings.autoRead = e.target.checked; saveSettings(); });
  on("#setHandsFree", "change", (e) => { settings.handsFree = e.target.checked; saveSettings(); });
  on("#setVoice", "change", (e) => { settings.voiceURI = e.target.value; saveSettings(); });
  on("#setAsrLang", "change", (e) => { settings.asrLang = e.target.value; saveSettings(); });
  on("#setTheme", "change", (e) => { settings.theme = e.target.value; saveSettings(); applyTheme(); });
  on("#exportAllBtn", "click", () => download(`shark-ai-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: "Shark AI", version: 1, chats }, null, 1), "application/json"));
  on("#importBtn", "click", () => $("#importInput").click());
  on("#importInput", "change", async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const incoming = Array.isArray(data) ? data : data.chats;
      if (!Array.isArray(incoming)) throw new Error("Not a Shark AI backup");
      let added = 0;
      for (const c of incoming) {
        if (!c?.id || !Array.isArray(c.messages)) continue;
        if (chats.some((x) => x.id === c.id)) continue;
        chats.push(c); added++;
      }
      saveChats(); renderChatList();
      toast(`Restored ${added} chat${added === 1 ? "" : "s"}.`);
    } catch (err) { toast("Restore failed: " + err.message, "error"); }
  });
  on("#clearChatsBtn", "click", () => {
    if (!confirm("Delete ALL chats on this device? This can't be undone.")) return;
    chats = []; activeId = null; saveChats(); renderChatList(); renderMessages();
    $("#settingsDlg").close();
    toast("All chats deleted.");
  });
}

/* ============================== Modes ============================== */

function renderModes() {
  const bar = $("#modeBar");
  bar.innerHTML = "";
  for (const [key, m] of Object.entries(MODES)) {
    bar.append(el("button", { class: "mode" + (settings.mode === key ? " active" : ""), type: "button", role: "tab", "aria-selected": settings.mode === key ? "true" : "false", onclick: () => setMode(key) }, m.label));
  }
  $("#translateRow").classList.toggle("hidden", settings.mode !== "translate");
  $("#input").placeholder = MODES[settings.mode]?.placeholder || MODES.chat.placeholder;
}

function setMode(key) {
  settings.mode = key;
  saveSettings();
  renderModes();
}

/* ============================== Misc UI ============================== */

function autoGrow() {
  const t = $("#input");
  t.style.height = "auto";
  t.style.height = Math.min(t.scrollHeight, 200) + "px";
}

function openNav() { $("#app").classList.add("nav-open"); $("#scrim").hidden = false; }
function closeNav() { $("#app").classList.remove("nav-open"); $("#scrim").hidden = true; }

function updateNet() {
  const b = $("#netBadge");
  b.textContent = navigator.onLine ? "Online" : "Offline";
  b.classList.toggle("off", !navigator.onLine);
}

function exportChat() {
  const c = activeChat();
  if (!c || !c.messages.length) { toast("Nothing to export yet."); return; }
  let md = `# ${c.title}\n\n_Exported from Shark AI (developed by MeshCode · x.com/meshcode2) — ${new Date().toLocaleString()}_\n\n`;
  for (const m of c.messages) {
    if (m.role === "user") {
      md += `**You:**\n\n`;
      (m.docs || []).forEach((d) => (md += `📎 ${d.name}\n\n`));
      (m.images || []).forEach(() => (md += `🖼️ (image)\n\n`));
      md += `${m.content}\n\n`;
    } else md += `**Shark AI:**\n\n${m.error ? "⚠️ " + m.error : cleanReply(m.content)}\n\n---\n\n`;
  }
  const safe = c.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 40) || "chat";
  download(`${safe}.md`, md, "text/markdown");
}

let installEvt = null;
function setupInstall() {
  const btn = $("#installBtn");
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone) return;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; btn.classList.remove("hidden"); });
  window.addEventListener("appinstalled", () => { btn.classList.add("hidden"); toast("Shark AI installed!"); });
  if (device.ios) btn.classList.remove("hidden");
  btn.addEventListener("click", async () => {
    if (installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; btn.classList.add("hidden"); }
    else if (device.ios) toast("On iPhone/iPad: tap the Share button, then “Add to Home Screen”.", "", 6000);
    else toast("Use your browser menu → “Install app” or “Add to Home screen”.", "", 5000);
  });
}

/* ============================== Welcome guide ============================== */

const W_STEPS = ["intro", "model", "install", "protect", "skills", "done"];
let wStep = 0;

function openWelcome() {
  wStep = 0;
  const d = $("#welcomeDlg");
  if (!d.open) d.showModal();
  renderWelcome();
}

function finishWelcome() {
  settings.onboarded = true;
  saveSettings();
  $("#welcomeDlg").close();
  renderMessages();
}

function wGo(delta) {
  wStep = Math.max(0, Math.min(W_STEPS.length - 1, wStep + delta));
  renderWelcome();
}

async function renderWelcome() {
  const body = $("#welcomeBody");
  const foot = $("#welcomeFoot");
  const dots = $("#welcomeDots");
  const step = W_STEPS[wStep];
  dots.innerHTML = "";
  W_STEPS.forEach((_, i) => dots.append(el("span", { class: "wdot" + (i === wStep ? " on" : i < wStep ? " done" : "") })));
  body.innerHTML = "";
  foot.innerHTML = "";
  const next = (label = "Next", primary = true) => el("button", { class: "btn " + (primary ? "btn-primary" : "btn-ghost"), type: "button", onclick: () => wGo(1) }, label);
  const back = () => el("button", { class: "btn btn-ghost", type: "button", onclick: () => wGo(-1) }, "Back");
  const check = (t) => el("div", { class: "wcheck" }, "✓ " + t);
  const stepLabel = (n, t) => el("div", { class: "wstep" }, `Step ${n} of 4 · ${t}`);

  if (step === "intro") {
    body.append(
      el("img", { src: "./icons/icon.svg", alt: "Shark AI logo", class: "wlogo" }),
      el("h2", { class: "wtitle" }, "Welcome to Shark AI"),
      el("p", { class: "wtext" }, `Your private AI that works offline on this ${device.mobile ? "phone" : "computer"}.`),
      el("ul", { class: "wlist" },
        el("li", {}, "✍️ Write, summarize, translate and code"),
        el("li", {}, "🎤 Talk to it with your voice"),
        el("li", {}, "📄 Read PDFs, documents and photos"),
        el("li", {}, "🔒 Nothing you type leaves your device"),
        el("li", {}, "📶 No data needed after setup"),
      ),
      el("p", { class: "wtext small muted" }, "Setup takes about 2 minutes plus one download. Use Wi-Fi if you can."),
      el("div", { class: "wcredit", html: 'Developed by <strong><a class="mc-link" href="https://x.com/meshcode2" target="_blank" rel="noopener noreferrer">MeshCode</a></strong>' }),
    );
    foot.append(el("button", { class: "btn btn-ghost", type: "button", onclick: finishWelcome }, "Skip"), next("Start setup"));
    return;
  }

  if (step === "model") {
    body.append(stepLabel(1, "Download your AI brain"));
    const gpu = await detectGPU();
    if (!gpu.ok) {
      body.append(
        el("h2", { class: "wtitle" }, "This browser can't run the chat brain"),
        el("p", { class: "wtext" }, "Shark AI's chat needs WebGPU. Open this site in Chrome or Edge (Android, Windows, Mac, Linux), or Safari on iPhone/iPad with iOS 26 or newer."),
        el("p", { class: "wtext muted small" }, "Voice input and the image reader still work in this browser. You can continue setup."),
      );
      foot.append(back(), next());
      return;
    }
    let cachedName = null;
    try {
      const w = await getWebLLM();
      for (const m of MODELS) if (await w.hasModelInCache(m.id).catch(() => false)) { cachedName = m.name; break; }
      await loadModelInfo();
    } catch {}
    if (cachedName) {
      body.append(el("h2", { class: "wtitle" }, "Your AI brain is ready"), check(`${cachedName} is downloaded and works offline.`),
        el("p", { class: "wtext muted small" }, "You can add more models later from Models & offline packs."));
      foot.append(back(), next());
      return;
    }
    const rec = MODELS.find((m) => m.id === recommendedModelId());
    const vram = modelInfo.get(rec.id)?.vram;
    body.append(
      el("h2", { class: "wtitle" }, "Download your AI brain"),
      el("p", { class: "wtext" }, "This is the part that thinks. It downloads once, then works with no internet."),
      el("div", { class: "wcard" },
        el("div", { class: "name" }, rec.name, el("span", { class: "badge rec" }, "Best for this device")),
        el("div", { class: "desc" }, rec.desc),
        vram ? el("div", { class: "meta" }, `Needs about ${fmtGB(vram)} of memory`) : null,
      ),
      el("p", { class: "wtext small muted" }, "📶 Use Wi-Fi. Keep this page open until it finishes (a few minutes)."),
    );
    const dl = el("button", { class: "btn btn-primary", type: "button", disabled: !navigator.onLine, onclick: async () => {
      dl.disabled = true; dl.textContent = "Downloading…";
      settings.model = rec.id; saveSettings();
      try { await ensureEngine(rec.id); wGo(1); }
      catch (e) { toast(explainError(e), "error", 7000); dl.disabled = false; dl.textContent = `Download ${rec.name}`; }
    } }, navigator.onLine ? `Download ${rec.name}` : "Connect to internet to download");
    foot.append(back(), el("button", { class: "btn btn-ghost", type: "button", onclick: () => wGo(1) }, "Later"), dl);
    return;
  }

  if (step === "install") {
    body.append(stepLabel(2, "Install the app"));
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    body.append(el("h2", { class: "wtitle" }, "Put Shark AI on your home screen"),
      el("p", { class: "wtext" }, "It opens like a normal app, even with no internet."));
    if (standalone) body.append(check("Already installed. You're using the app."));
    else if (installEvt) {
      body.append(el("button", { class: "btn btn-primary", type: "button", onclick: async () => {
        installEvt.prompt(); await installEvt.userChoice; installEvt = null; $("#installBtn").classList.add("hidden"); renderWelcome();
      } }, "Install Shark AI"));
    } else if (device.ios) {
      body.append(el("ol", { class: "wlist num" },
        el("li", {}, "Tap the Share button (square with an arrow) at the bottom of Safari"),
        el("li", {}, "Scroll down and tap “Add to Home Screen”"),
        el("li", {}, "Tap “Add”")));
    } else if (device.mobile) {
      body.append(el("ol", { class: "wlist num" },
        el("li", {}, "Tap the ⋮ menu at the top right of Chrome"),
        el("li", {}, "Tap “Install app” or “Add to Home screen”"),
        el("li", {}, "Tap “Install”")));
    } else {
      body.append(el("ol", { class: "wlist num" },
        el("li", {}, "Click the install icon at the right end of the address bar"),
        el("li", {}, "Or open the browser menu → “Install Shark AI”"),
        el("li", {}, "Click “Install”")));
    }
    foot.append(back(), next(standalone ? "Next" : "Done, next"));
    return;
  }

  if (step === "protect") {
    body.append(stepLabel(3, "Keep your downloads safe"));
    body.append(el("h2", { class: "wtitle" }, "Stop the browser from deleting Shark AI"),
      el("p", { class: "wtext" }, "When a device runs low on space, browsers can clear saved files. This asks the browser to keep Shark AI's downloads so you don't have to download again."));
    let persisted = false;
    try { persisted = await navigator.storage?.persisted?.(); } catch {}
    if (persisted) body.append(check("Protected."));
    else body.append(el("button", { class: "btn btn-primary", type: "button", onclick: async () => {
      let ok = false;
      try { ok = await navigator.storage?.persist?.(); } catch {}
      toast(ok ? "Downloads protected." : "The browser said no for now. Installing the app and using it often usually fixes this.", "", 5000);
      renderWelcome();
    } }, "Protect downloads"));
    foot.append(back(), next());
    return;
  }

  if (step === "skills") {
    body.append(stepLabel(4, "Optional extras"));
    body.append(el("h2", { class: "wtitle" }, "Add voice and image reading"),
      el("p", { class: "wtext" }, "Get these now so they also work offline. They download automatically the first time you use them, too."));
    for (const [key, s] of Object.entries(SKILLS)) {
      const cached = await skillCached(key);
      const btn = cached ? check("Ready") : el("button", { class: "btn btn-ghost btn-sm", type: "button", disabled: !navigator.onLine, onclick: async () => {
        btn.disabled = true; btn.textContent = "Downloading…";
        try { await withSkill(key, () => true); } catch (e) { toast(String(e.message || e), "error", 6000); }
        renderWelcome();
      } }, "Download");
      body.append(el("div", { class: "wcard row" },
        el("div", { class: "info" }, el("div", { class: "name" }, s.name), el("div", { class: "desc" }, s.desc), el("div", { class: "meta" }, s.size)),
        btn));
    }
    foot.append(back(), next());
    return;
  }

  // done
  body.append(
    el("img", { src: "./icons/icon.svg", alt: "", class: "wlogo" }),
    el("h2", { class: "wtitle" }, "You're all set 🦈"),
    el("ul", { class: "wlist" },
      el("li", {}, "Pick a mode above the message box: Write, Translate, Code…"),
      el("li", {}, "Tap 📎 to add a PDF, file or photo"),
      el("li", {}, "Tap 🎤 to speak instead of typing"),
      el("li", {}, "Switch models any time from the button at the top"),
    ),
    el("p", { class: "wtext small muted" }, "You can replay this guide from Settings."),
    el("div", { class: "wcredit", html: 'Developed by <strong><a class="mc-link" href="https://x.com/meshcode2" target="_blank" rel="noopener noreferrer">MeshCode</a></strong>' }),
  );
  foot.append(back(), el("button", { class: "btn btn-primary", type: "button", onclick: finishWelcome }, "Start chatting"));
}

/* ============================== Init ============================== */

async function init() {
  applyTheme();
  matchMedia("(prefers-color-scheme: light)").addEventListener?.("change", () => settings.theme === "system" && applyTheme());

  // Translate languages
  const tsel = $("#translateTo");
  LANGUAGES.forEach((l) => tsel.append(el("option", { value: l }, l)));
  tsel.value = settings.translateTo;
  tsel.addEventListener("change", (e) => { settings.translateTo = e.target.value; saveSettings(); });

  renderModes();
  bindSettings();
  setupInstall();
  updateNet();
  window.addEventListener("online", updateNet);
  window.addEventListener("offline", updateNet);
  if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

  // Events
  $("#newChatBtn").addEventListener("click", newChat);
  $("#menuBtn").addEventListener("click", openNav);
  $("#scrim").addEventListener("click", closeNav);
  $("#chatSearch").addEventListener("input", renderChatList);
  $("#modelChip").addEventListener("click", openModels);
  $("#openModelsBtn").addEventListener("click", () => { closeNav(); openModels(); });
  $("#openSettingsBtn").addEventListener("click", () => { closeNav(); openSettings(); });
  $("#exportBtn").addEventListener("click", exportChat);
  $("#replayGuideBtn").addEventListener("click", () => { $("#settingsDlg").close(); openWelcome(); });
  $("#welcomeDlg").addEventListener("cancel", (e) => { e.preventDefault(); });
  $("#loaderHide").addEventListener("click", () => { loaderHidden = true; $("#loader").classList.add("hidden"); });
  document.querySelectorAll("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  document.querySelectorAll("dialog:not(#welcomeDlg)").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  const input = $("#input");
  input.addEventListener("input", autoGrow);
  input.addEventListener("keydown", (e) => {
    const coarse = matchMedia("(pointer: coarse)").matches;
    if (e.key === "Enter" && !e.shiftKey && !coarse && !e.isComposing) { e.preventDefault(); send(); }
  });
  input.addEventListener("paste", (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) { e.preventDefault(); addFiles(files); }
  });
  $("#composer").addEventListener("submit", (e) => { e.preventDefault(); send(); });
  $("#attachBtn").addEventListener("click", () => $("#fileInput").click());
  $("#fileInput").addEventListener("change", (e) => { addFiles([...e.target.files]); e.target.value = ""; });
  $("#micBtn").addEventListener("click", toggleMic);

  messagesEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-copy-code]");
    if (b) {
      copyText(b.closest(".codeblock").querySelector("code").textContent);
      b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy"), 1200);
    }
  });

  // Drag & drop
  let dragDepth = 0;
  window.addEventListener("dragenter", (e) => { if (e.dataTransfer?.types?.includes("Files")) { dragDepth++; $("#app").classList.add("dragging"); } });
  window.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; $("#app").classList.remove("dragging"); } });
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault(); dragDepth = 0; $("#app").classList.remove("dragging");
    if (e.dataTransfer?.files?.length) addFiles([...e.dataTransfer.files]);
  });

  // Data
  chats = (await store.get("chats")) || [];
  chats.forEach((c) => c.messages.forEach((m) => { delete m.streaming; delete m.status; }));
  activeId = chats.slice().sort((a, b) => b.updated - a.updated)[0]?.id || null;
  if (activeId && !activeChat().messages.length) { /* keep empty chat */ }
  renderChatList();
  renderMessages();
  setModelState("off");

  // Service worker (offline app shell)
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW failed", e));
  }

  // First visit: walk the user through setup.
  if (!settings.onboarded) setTimeout(openWelcome, 400);

  // Warm up the saved model in the background if it's already downloaded.
  if (settings.model && settings.onboarded) {
    setTimeout(async () => {
      try {
        const gpu = await detectGPU();
        if (!gpu.ok) return;
        const w = await getWebLLM();
        if (await w.hasModelInCache(settings.model)) {
          loaderHidden = true; // quiet warm-up
          setModelState("loading");
          await ensureEngine(settings.model);
          loaderHidden = false;
        }
      } catch (e) { loaderHidden = false; console.warn("Warm-up failed", e); setModelState("off"); }
    }, 700);
  }
}

init();
