const STORAGE_KEY = "rising-habit-hero-v1";

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
  xpValue: document.querySelector("#xpValue"),
  xpGoal: document.querySelector("#xpGoal"),
  shieldValue: document.querySelector("#shieldValue"),
  moraleValue: document.querySelector("#moraleValue"),
  xpFill: document.querySelector("#xpFill"),
  questList: document.querySelector("#questList"),
  addQuestBtn: document.querySelector("#addQuestBtn"),
  questForm: document.querySelector("#questForm"),
  questInput: document.querySelector("#questInput"),
  xpInput: document.querySelector("#xpInput"),
  questTemplate: document.querySelector("#questTemplate"),
};

function xpThreshold() {
  return 100 + (state.level - 1) * 20;
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

function render() {
  renderStats();
  renderQuests();
}

elements.addQuestBtn.addEventListener("click", () => {
  elements.questForm.hidden = !elements.questForm.hidden;
});

elements.questForm.addEventListener("submit", handleCreateQuest);

render();
