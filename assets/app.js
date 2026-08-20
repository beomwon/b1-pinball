/* ==========================================================================
   .B1 핀볼 — 화면 조작 로직
   게임 본체(물리·렌더링)는 roulette.js 안에 있고, 여기서는
   window.roulette / window.options 를 통해 조작만 한다.

   주요 API
     roulette.setMarbles(names)      참가자 목록 반영
     roulette.setWinningRank(n)      당첨 순위 (0부터)
       roulette.setSpeed(n)            재생 속도
     roulette.getMaps() / setMap(i) / getCurrentMap()
     roulette.getCount()             구슬 개수
     roulette.start()                경주 시작
     roulette.addEventListener('goal' | 'message', fn)
   ========================================================================== */

// 맵 이름은 엔진이 영어로 돌려주기 때문에, 브라우저 언어와 무관하게 한글로 보이도록 직접 맞춘다.
const MAP_NAMES = {
  "Wheel of fortune": "운명의 수레바퀴",
  BubblePop: "버블팝",
  "Pot of greed": "욕망의 항아리",
  "Yoru ni Kakeru": "밤을 달리다",
};

// 후원 — 카카오페이 송금코드. url 을 비우면 후원 버튼이 아예 안 보인다.
const DONATE = {
  url: "https://qr.kakaopay.com/281006011000043002117284",
};

// 엔진이 영어로 보내는 알림 문구
const MESSAGES = {
  "The result has been copied": "결과를 복사했습니다",
};

const $ = (sel) => document.querySelector(sel);

let ready = false;
let winnerType = "last"; // 'first' | 'last' | 'custom'

/* ── 이름 파싱 ───────────────────────────────────────────────────────────── */

/** 입력칸을 쉼표/줄바꿈으로 잘라 이름 배열로 만든다. */
function getNames() {
  return $("#in_names")
    .value.trim()
    .split(/[,\r\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "홍길동*3" → {name:'홍길동', count:3, weight:1}, "홍길동/2" → weight:2 */
function parseName(entry) {
  const weight = /(\/\d+)/;
  const count = /(\*\d+)/;
  return {
    name: /^\s*([^/*]+)?/.exec(entry)[1],
    weight: weight.test(entry) ? parseInt(weight.exec(entry)[1].replace("/", "")) : 1,
    count: count.test(entry) ? parseInt(count.exec(entry)[1].replace("*", "")) : 1,
  };
}

/* ── 참가자 반영 ─────────────────────────────────────────────────────────── */

/** 입력칸 내용을 게임에 밀어 넣고, 버튼·카운터 상태를 갱신한다. */
function getReady() {
  const entries = getNames();
  window.roulette.setMarbles(entries);
  ready = entries.length > 0;

  updateCount();
  $("#btnStart").disabled = !ready;

  if (winnerType === "first") setWinnerRank(1);
  else if (winnerType === "last") setWinnerRank(Math.max(1, window.roulette.getCount()));
}

/** "3명 · 구슬 7개" 같은 요약을 헤더에 보여준다. */
function updateCount() {
  const entries = getNames().map(parseName);
  const people = new Set(entries.map((e) => e.name)).size;
  const marbles = window.roulette.getCount();
  const el = $("#entryCount");

  el.textContent =
    people === 0 ? "0명" : marbles > people ? `${people}명 · 구슬 ${marbles}개` : `${people}명`;
  el.classList.toggle("has-entries", people > 0);
}

/** 중복 이름을 "이름*n" 으로 합쳐 입력칸을 정리한다. */
function normalizeNames() {
  const merged = {};
  getNames().forEach((entry) => {
    const parsed = parseName(entry);
    const key = parsed.weight > 1 ? `${parsed.name}/${parsed.weight}` : parsed.name;
    merged[key] = (merged[key] || 0) + parsed.count;
  });

  const text = Object.keys(merged)
    .map((key) => (merged[key] > 1 ? `${key}*${merged[key]}` : key))
    .join(",");

  if ($("#in_names").value !== text) {
    $("#in_names").value = text;
    getReady();
  }
}

/* ── 당첨 순위 ───────────────────────────────────────────────────────────── */

function setWinnerRank(rank) {
  $("#in_winningRank").value = rank;
  window.options.winningRank = rank - 1;
  window.roulette.setWinningRank(window.options.winningRank);

  $(".btn-first-winner").classList.toggle("active", winnerType === "first");
  $(".btn-last-winner").classList.toggle("active", winnerType === "last");
  $("#in_winningRank").classList.toggle("active", winnerType === "custom");
}

/* ── 초기화 ─────────────────────────────────────────────────────────────── */

function initialize() {
  // 물리 엔진(wasm) 로딩이 끝날 때까지 기다린다
  if (!window.roulette || !window.roulette.isReady) {
    setTimeout(initialize, 100);
    return;
  }

  localStorage.removeItem("mbr_names");
  $("#in_names").value = "";

  // 녹화 기능은 쓰지 않는다 (엔진 기본값이 켜짐이라 명시적으로 끈다)
  window.options.autoRecording = false;
  window.roulette.setAutoRecording(false);

  // 테마는 다크 고정
  window.options.darkMode = true;
  window.roulette.setTheme("dark");

  preloadPixelFont();

  // 입력칸
  $("#in_names").addEventListener("input", getReady);
  $("#in_names").addEventListener("blur", normalizeNames);
  $("#in_names").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) startRace();
  });

  // 시작 / 섞기
  $("#btnShuffle").addEventListener("click", getReady);
  $("#btnStart").addEventListener("click", startRace);

  // 옵션 스위치
  $("#chkSkill").addEventListener("change", (e) => {
    window.options.useSkills = e.target.checked;
    window.roulette.setWinningRank(window.options.winningRank);
  });
  // 당첨 순위
  $(".btn-first-winner").addEventListener("click", () => {
    winnerType = "first";
    setWinnerRank(1);
  });
  $(".btn-last-winner").addEventListener("click", () => {
    winnerType = "last";
    setWinnerRank(Math.max(1, window.roulette.getCount()));
  });
  $("#in_winningRank").addEventListener("change", (e) => {
    const rank = parseInt(e.target.value, 10);
    winnerType = "custom";
    setWinnerRank(isNaN(rank) ? 0 : rank);
  });

  setupMapSelect();
  setupSpeed();
  setupCollapse();
  setupDonate();

  // 경주가 끝나면 패널을 다시 보여준다
  window.roulette.addEventListener("goal", () => {
    ready = false;
    setTimeout(() => $("#settings").classList.remove("hide"), 3000);
  });

  // 순위 복사 등 게임 알림을 토스트로 띄운다
  window.roulette.addEventListener("message", (e) => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = MESSAGES[e.detail] || e.detail;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1200);
  });

  getReady();
}

function startRace() {
  if (!ready) return;
  window.roulette.start();
  $("#settings").classList.add("hide");
}

/* ── 후원 팝업 ───────────────────────────────────────────────────────────── */

function isMobile() {
  if (navigator.userAgentData) return navigator.userAgentData.mobile === true;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function setupDonate() {
  const button = $("#btnDonate");
  const modal = $("#donateModal");
  if (!DONATE.url) return; // 송금코드가 없으면 버튼을 숨겨둔다

  // 카카오페이 송금 링크는 앱이 깔린 기기에서만 열린다.
  // PC 에서 누르면 404 가 뜨므로, 모바일에서만 버튼을 보여주고 PC 는 QR 만 띄운다.
  if (isMobile()) {
    $("#donateLink").href = DONATE.url;
    $("#donateLink").hidden = false;
    $("#donateScanHint").hidden = true;
  }

  button.hidden = false;

  const open = () => {
    modal.hidden = false;
    $(".modal-close").focus();
  };
  const close = () => {
    modal.hidden = true;
    button.focus();
  };

  button.addEventListener("click", open);
  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

/* ── 픽셀 폰트 ───────────────────────────────────────────────────────────── */

/** 캔버스는 폰트가 로드돼 있어야 픽셀 폰트로 그린다. 미리 불러둔다. */
function preloadPixelFont() {
  if (!document.fonts) return;
  ["12pt Galmuri11", "bold 11pt Galmuri11", "bold 48px Galmuri11", "bold 72px Galmuri11"].forEach(
    (f) => document.fonts.load(f),
  );
}

/* ── 맵 선택 ─────────────────────────────────────────────────────────────── */

function setupMapSelect() {
  const select = $("#sltMap");

  window.roulette.getMaps().forEach((map) => {
    const option = document.createElement("option");
    option.value = map.index;
    option.textContent = MAP_NAMES[map.title] || map.title;
    select.append(option);
  });

  select.addEventListener("change", (e) => {
    window.roulette.setMap(e.target.value);
    getReady(); // 맵을 바꾸면 구슬이 초기화되므로 명단을 다시 넣는다
  });
}

/* ── 속도 슬라이더 ───────────────────────────────────────────────────────── */

function setupSpeed() {
  const range = $("#speedRange");
  const label = $("#speedVal");

  const apply = () => {
    const speed = Math.round(parseFloat(range.value) * 10) / 10;
    window.roulette.setSpeed(speed);
    label.textContent = speed.toFixed(1) + "x";
    // 채워진 구간을 색으로 표시 (CSS 의 --fill)
    const pct = ((speed - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty("--fill", pct + "%");
  };

  range.addEventListener("input", apply);
  apply();
}

/* ── 패널 접기/펼치기 ────────────────────────────────────────────────────── */

function setupCollapse() {
  const button = $("#btnToggleSettings");
  const body = $(".collapsible-rows");

  button.addEventListener("click", () => {
    const collapsed = body.classList.toggle("collapsed");
    button.setAttribute("aria-expanded", String(!collapsed));
    button.querySelector(".dock-toggle-text").textContent = collapsed ? "펼치기" : "접기";
    button.querySelector(".toggle-arrow").style.transform = collapsed ? "rotate(180deg)" : "";
  });
}

document.addEventListener("DOMContentLoaded", initialize);
