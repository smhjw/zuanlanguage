const outputEl = document.getElementById("output");
const modeBadge = document.getElementById("modeBadge");
const btnBlast = document.getElementById("btnBlast");
const btnLotus = document.getElementById("btnLotus");
const btnBack = document.getElementById("btnBack");
const btnDad = document.getElementById("btnDad");
const btnCopy = document.getElementById("btnCopy");
const dadCheck = btnDad ? btnDad.querySelector(".check") : null;

const QUOTES_FILES = ["祖安语录.txt", "祖安语录2.txt"];

let history = [];
let historyIndex = -1;
let dadMode = false;
let currentMode = "blast";
let loadedLines = [];

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
        fetch(file, { cache: "no-store" })
          .then((response) => (response.ok ? response.text() : ""))
          .catch(() => "")
      )
    );
    const lines = results.flatMap((text) => normalizeLines(text));
    if (lines.length > 0) {
      loadedLines = Array.from(new Set(lines));
      if (history.length === 0) {
        generateLine();
      }
    }
  } catch (err) {
    // Ignore load errors; output will show empty pool message.
  }
}

function getPool() {
  if (dadMode) {
    return loadedLines.filter((line) => line.includes("爹"));
  }

  return loadedLines;
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

function setOutput(text) {
  outputEl.textContent = text;
}

function generateLine() {
  const pool = getPool();
  if (pool.length === 0) {
    if (location.protocol === "file:") {
      setOutput(
        "检测到本地 file:// 打开，浏览器会阻止读取 txt。请用本地服务器或 GitHub Pages 访问。"
      );
      return;
    }
    setOutput("词库为空或未加载，请检查祖安语录.txt / 祖安语录2.txt 是否可访问。");
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

async function copyCurrent() {
  const text = outputEl.textContent.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    btnCopy.textContent = "已复制";
  } catch (err) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    btnCopy.textContent = "已复制";
  }

  setTimeout(() => {
    btnCopy.textContent = "复制 COPY";
  }, 1200);
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

btnDad.addEventListener("click", () => {
  dadMode = !dadMode;
  updateModeUI();
  generateLine();
});

btnBack.addEventListener("click", goBack);
btnCopy.addEventListener("click", copyCurrent);
outputEl.addEventListener("dblclick", generateLine);

updateModeUI();
loadQuotes();
