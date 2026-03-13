const STORAGE_KEY = "rising-habit-hero-v1";

const ANIME_LEVELS = [
  "Sakura Kinomoto",
  "Usagi Tsukino",
  "Edward Elric",
  "Levi Ackerman",
  "Kakashi Hatake",
  "Naruto Uzumaki",
  "Gojo Satoru",
  "Goku (Ultra Instinct)",
  "Saitama",
  "Zeno-sama",
];

const defaultState = {
  level: 1,
  xp: 0,
  shield: 100,
  quests: [
    { id: crypto.randomUUID(), title: "Morning Training", rewardXp: 40, completed: 0, failed: 0 },
    { id: crypto.randomUUID(), title: "Read 20 pages", rewardXp: 50, completed: 0, failed: 0 },
    { id: crypto.randomUUID(), title: "30 min Workout", rewardXp: 60, completed: 0, failed: 0 },
  ],
};

const state = loadState();

const elements = {
  levelValue: document.querySelector("#levelValue"),
  characterValue: document.querySelector("#characterValue"),
  xpValue: document.querySelector("#xpValue"),
  xpGoal: document.querySelector("#xpGoal"),
  shieldValue: document.querySelector("#shieldValue"),
  moraleValue: document.querySelector("#moraleValue"),
  xpFill: document.querySelector("#xpFill"),
  questList: document.querySelector("#questList"),
  addQuestBtn: document.querySelector("#addQuestBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  importCsvBtn: document.querySelector("#importCsvBtn"),
  csvFileInput: document.querySelector("#csvFileInput"),
  importStatus: document.querySelector("#importStatus"),
  questForm: document.querySelector("#questForm"),
  questInput: document.querySelector("#questInput"),
  xpInput: document.querySelector("#xpInput"),
  questTemplate: document.querySelector("#questTemplate"),
};

function xpThreshold() {
  return 100 + (state.level - 1) * 20;
}

function getAnimeForm(level) {
  const index = Math.max(0, Math.min(level - 1, ANIME_LEVELS.length - 1));
  return ANIME_LEVELS[index];
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      quests: Array.isArray(parsed.quests) ? parsed.quests : structuredClone(defaultState.quests),
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateMorale() {
  if (state.shield >= 80) return "Unbreakable";
  if (state.shield >= 55) return "Steady";
  if (state.shield >= 30) return "Shaken";
  return "Critical";
}

function renderStats() {
  const cap = xpThreshold();
  const percent = Math.min((state.xp / cap) * 100, 100);

  elements.levelValue.textContent = state.level;
  elements.characterValue.textContent = getAnimeForm(state.level);
  elements.xpValue.textContent = state.xp;
  elements.xpGoal.textContent = cap;
  elements.shieldValue.textContent = `${state.shield}%`;
  elements.moraleValue.textContent = updateMorale();
  elements.xpFill.style.width = `${percent}%`;
}

function renderQuests() {
  elements.questList.innerHTML = "";

  state.quests.forEach((quest) => {
    const node = elements.questTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".quest-title").textContent = quest.title;
    node.querySelector(".quest-meta").textContent = `Reward: ${quest.rewardXp} XP | Cleared: ${quest.completed} | Failed: ${quest.failed}`;

    node.querySelector(".complete-btn").addEventListener("click", () => handleComplete(quest.id));
    node.querySelector(".fail-btn").addEventListener("click", () => handleFail(quest.id));
    node.querySelector(".delete-btn").addEventListener("click", () => handleDelete(quest.id));

    elements.questList.appendChild(node);
  });
}

function processLevelUps() {
  let cap = xpThreshold();
  while (state.xp >= cap) {
    state.xp -= cap;
    state.level += 1;
    state.shield = Math.min(state.shield + 12, 100);
    cap = xpThreshold();
  }
}

function handleComplete(id) {
  const quest = state.quests.find((item) => item.id === id);
  if (!quest) return;

  quest.completed += 1;
  state.xp += quest.rewardXp;
  state.shield = Math.min(state.shield + 5, 100);
  processLevelUps();

  saveState();
  render();
}

function handleFail(id) {
  const quest = state.quests.find((item) => item.id === id);
  if (!quest) return;

  quest.failed += 1;
  const xpLoss = Math.max(Math.round(quest.rewardXp * 0.4), 10);
  state.xp = Math.max(state.xp - xpLoss, 0);
  state.shield = Math.max(state.shield - 12, 0);

  if (state.shield <= 20 && state.level > 1) {
    state.level -= 1;
    state.shield = 45;
    state.xp = Math.min(state.xp, xpThreshold() - 1);
  }

  saveState();
  render();
}

function handleDelete(id) {
  state.quests = state.quests.filter((quest) => quest.id !== id);
  saveState();
  render();
}

function handleCreateQuest(event) {
  event.preventDefault();
  const title = elements.questInput.value.trim();
  const rewardXp = Number(elements.xpInput.value);

  if (!title || Number.isNaN(rewardXp)) return;

  state.quests.push({
    id: crypto.randomUUID(),
    title,
    rewardXp,
    completed: 0,
    failed: 0,
  });

  event.target.reset();
  elements.xpInput.value = 40;
  saveState();
  render();
}

function escapeCsv(value) {
  const safeValue = String(value ?? "");
  if (safeValue.includes(",") || safeValue.includes('"') || safeValue.includes("\n")) {
    return `"${safeValue.replaceAll('"', '""')}"`;
  }
  return safeValue;
}

function exportCsv() {
  const rows = [["type", "level", "xp", "shield", "id", "title", "rewardXp", "completed", "failed"]];
  rows.push(["profile", state.level, state.xp, state.shield, "", "", "", "", ""]);

  state.quests.forEach((quest) => {
    rows.push(["quest", "", "", "", quest.id, quest.title, quest.rewardXp, quest.completed, quest.failed]);
  });

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rising-habit-hero-save.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  elements.importStatus.textContent = "CSV exported successfully.";
}

function parseCsvLine(line) {
  const columns = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      columns.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  columns.push(current);
  return columns;
}

function importCsvText(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) throw new Error("CSV is empty or missing data rows.");

  const rows = lines.map(parseCsvLine);
  const profile = rows.find((row) => row[0] === "profile");

  if (!profile) throw new Error("CSV is missing a profile row.");

  const importedLevel = Number(profile[1]);
  const importedXp = Number(profile[2]);
  const importedShield = Number(profile[3]);

  if ([importedLevel, importedXp, importedShield].some((value) => Number.isNaN(value))) {
    throw new Error("Profile stats are invalid.");
  }

  state.level = Math.max(1, Math.floor(importedLevel));
  state.xp = Math.max(0, Math.floor(importedXp));
  state.shield = Math.max(0, Math.min(100, Math.floor(importedShield)));

  const importedQuests = rows
    .filter((row) => row[0] === "quest")
    .map((row) => {
      const rewardXp = Number(row[6]);
      const completed = Number(row[7]);
      const failed = Number(row[8]);
      if (!row[5] || Number.isNaN(rewardXp) || Number.isNaN(completed) || Number.isNaN(failed)) {
        return null;
      }

      return {
        id: row[4] || crypto.randomUUID(),
        title: row[5],
        rewardXp: Math.max(10, Math.floor(rewardXp)),
        completed: Math.max(0, Math.floor(completed)),
        failed: Math.max(0, Math.floor(failed)),
      };
    })
    .filter(Boolean);

  if (!importedQuests.length) {
    throw new Error("No valid quest rows were found in the CSV.");
  }

  state.quests = importedQuests;
  saveState();
  render();
}

function handleImportFile(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      importCsvText(String(reader.result ?? ""));
      elements.importStatus.textContent = "CSV imported successfully.";
    } catch (error) {
      elements.importStatus.textContent = `Import failed: ${error.message}`;
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

function render() {
  renderStats();
  renderQuests();
}

elements.addQuestBtn.addEventListener("click", () => {
  elements.questForm.hidden = !elements.questForm.hidden;
});

elements.exportCsvBtn.addEventListener("click", exportCsv);
elements.importCsvBtn.addEventListener("click", () => elements.csvFileInput.click());
elements.csvFileInput.addEventListener("change", handleImportFile);

elements.questForm.addEventListener("submit", handleCreateQuest);

render();
