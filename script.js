const outputEl = document.getElementById("output");
const modeBadge = document.getElementById("modeBadge");
const btnBlast = document.getElementById("btnBlast");
const btnLotus = document.getElementById("btnLotus");
const btnNext = document.getElementById("btnNext");
const btnBack = document.getElementById("btnBack");
const btnDad = document.getElementById("btnDad");
const btnCopy = document.getElementById("btnCopy");
const dadCheck = btnDad ? btnDad.querySelector(".check") : null;
const toastEl = document.getElementById("toast");
const filterNoDadBtn = document.getElementById("filterNoDad");
const filterNoInsultBtn = document.getElementById("filterNoInsult");
const filterKeepDirtyBtn = document.getElementById("filterKeepDirty");
const keywordInput = document.getElementById("keywordInput");

const ASSET_VERSION = "20260224";
const QUOTES_FILES = ["祖安语录.txt", "祖安语录2.txt"];
const INSULT_WORDS = [
  "傻逼",
  "垃圾",
  "废物",
  "脑残",
  "弱智",
  "蠢货",
  "白痴",
  "畜生",
  "滚",
  "废材"
];
const DIRTY_WORDS = [
  "操",
  "草",
  "艹",
  "妈",
  "逼",
  "屎",
  "尿",
  "鸡巴",
  "他妈",
  "狗"
];

let history = [];
let historyIndex = -1;
let dadMode = false;
let currentMode = "blast";
let loadedLines = [];
let filterNoDad = true;
let filterNoInsult = false;
let keepDirty = true;
let retryCount = 0;
const MAX_RETRY = 3;
const RETRY_DELAY = 1200;

function normalizeLines(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function loadQuotes() {
  try {
    const results = await Promise.all(
      QUOTES_FILES.map((file) =>
        fetch(`${file}?v=${ASSET_VERSION}`, { cache: "no-store" })
          .then((response) => (response.ok ? response.text() : ""))
          .catch(() => "")
      )
    );
    const lines = results.flatMap((text) => normalizeLines(text));
    if (lines.length > 0) {
      loadedLines = Array.from(new Set(lines));
      retryCount = 0;
      if (history.length === 0) {
        generateLine();
      }
      return;
    }
    if (retryCount < MAX_RETRY) {
      retryCount += 1;
      setOutput("词库加载失败，正在重试...");
      setTimeout(loadQuotes, RETRY_DELAY);
    } else {
      setOutput("词库加载失败，请刷新页面重试。");
    }
  } catch (err) {
    if (retryCount < MAX_RETRY) {
      retryCount += 1;
      setOutput("词库加载失败，正在重试...");
      setTimeout(loadQuotes, RETRY_DELAY);
    } else {
      setOutput("词库加载失败，请刷新页面重试。");
    }
  }
}

function containsAny(line, list) {
  return list.some((word) => line.includes(word));
}

function parseKeywords() {
  if (!keywordInput) return [];
  const raw = keywordInput.value.trim();
  if (!raw) return [];
  return raw.split(/[\s,，、]+/).map((word) => word.trim()).filter(Boolean);
}

function getPool() {
  let pool = loadedLines;
  if (dadMode) {
    pool = pool.filter((line) => line.includes("爹"));
  } else if (filterNoDad) {
    pool = pool.filter((line) => !line.includes("爹"));
  }

  if (!keepDirty) {
    pool = pool.filter((line) => !containsAny(line, DIRTY_WORDS));
  }

  if (filterNoInsult) {
    pool = pool.filter((line) => !containsAny(line, INSULT_WORDS));
  }

  const keywords = parseKeywords();
  if (keywords.length > 0) {
    const keywordPool = pool.filter((line) =>
      keywords.some((word) => line.includes(word))
    );
    if (keywordPool.length > 0) {
      pool = keywordPool;
    }
  }

  return pool;
}

function updateModeUI() {
  const baseLabel = currentMode === "blast" ? "火力全开" : "口吐莲花";
  modeBadge.textContent = `模式：${baseLabel}${dadMode ? " · 骂爹" : ""}`;
  btnBlast.classList.toggle("active", currentMode === "blast");
  btnLotus.classList.toggle("active", currentMode === "lotus");
  btnDad.classList.toggle("active", dadMode);
  if (dadCheck) {
    dadCheck.textContent = dadMode ? "☑" : "□";
  }
  if (btnDad) {
    btnDad.setAttribute("aria-pressed", dadMode ? "true" : "false");
  }
}

function updateFiltersUI() {
  if (filterNoDadBtn) {
    const check = filterNoDadBtn.querySelector(".check");
    if (check) check.textContent = filterNoDad ? "☑" : "□";
    filterNoDadBtn.setAttribute("aria-pressed", filterNoDad ? "true" : "false");
  }
  if (filterNoInsultBtn) {
    const check = filterNoInsultBtn.querySelector(".check");
    if (check) check.textContent = filterNoInsult ? "☑" : "□";
    filterNoInsultBtn.setAttribute("aria-pressed", filterNoInsult ? "true" : "false");
  }
  if (filterKeepDirtyBtn) {
    const check = filterKeepDirtyBtn.querySelector(".check");
    if (check) check.textContent = keepDirty ? "☑" : "□";
    filterKeepDirtyBtn.setAttribute("aria-pressed", keepDirty ? "true" : "false");
  }
}

let toastTimer;
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 1400);
}

function setOutput(text) {
  outputEl.textContent = text;
}

function generateLine() {
  if (loadedLines.length === 0) {
    setOutput("词库为空或未加载，请稍后再试。");
    return;
  }
  const pool = getPool();
  if (pool.length === 0) {
    setOutput("筛选条件过严，暂无结果。");
    return;
  }

  let next = pool[Math.floor(Math.random() * pool.length)];
  if (history.length > 0) {
    let tries = 0;
    while (next === history[historyIndex] && tries < 4) {
      next = pool[Math.floor(Math.random() * pool.length)];
      tries += 1;
    }
  }

  history = history.slice(0, historyIndex + 1);
  history.push(next);
  historyIndex = history.length - 1;
  setOutput(next);
}

function goBack() {
  if (historyIndex <= 0) {
    setOutput("没有上一句了，继续生成吧。");
    return;
  }
  historyIndex -= 1;
  setOutput(history[historyIndex]);
}

async function copyCurrent(showButtonFeedback = true) {
  const text = outputEl.textContent.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    if (btnCopy && showButtonFeedback) {
      btnCopy.textContent = "已复制";
    }
  } catch (err) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    if (btnCopy && showButtonFeedback) {
      btnCopy.textContent = "已复制";
    }
  }

  showToast("已复制");

  if (btnCopy && showButtonFeedback) {
    setTimeout(() => {
      btnCopy.textContent = "复制 COPY";
    }, 1200);
  }
}

btnBlast.addEventListener("click", () => {
  currentMode = "blast";
  updateModeUI();
  generateLine();
});

btnLotus.addEventListener("click", () => {
  currentMode = "lotus";
  updateModeUI();
  generateLine();
});

if (btnNext) {
  btnNext.addEventListener("click", generateLine);
}

btnDad.addEventListener("click", () => {
  dadMode = !dadMode;
  updateModeUI();
  generateLine();
});

if (filterNoDadBtn) {
  filterNoDadBtn.addEventListener("click", () => {
    filterNoDad = !filterNoDad;
    updateFiltersUI();
    generateLine();
  });
}

if (filterNoInsultBtn) {
  filterNoInsultBtn.addEventListener("click", () => {
    filterNoInsult = !filterNoInsult;
    updateFiltersUI();
    generateLine();
  });
}

if (filterKeepDirtyBtn) {
  filterKeepDirtyBtn.addEventListener("click", () => {
    keepDirty = !keepDirty;
    updateFiltersUI();
    generateLine();
  });
}

if (keywordInput) {
  keywordInput.addEventListener("input", () => {
    if (loadedLines.length > 0) {
      generateLine();
    }
  });
}

btnBack.addEventListener("click", goBack);
btnCopy.addEventListener("click", () => copyCurrent(true));
outputEl.addEventListener("dblclick", generateLine);
outputEl.addEventListener("click", () => copyCurrent(false));

updateModeUI();
updateFiltersUI();
loadQuotes();
