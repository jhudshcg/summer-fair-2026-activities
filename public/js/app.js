/*
 * Summer Fair 2026 shared client-side logic.
 * Slice 1 centralises page metadata, progress state and shared rendering helpers.
 * Version: 2026-06-20.1
 */

const APP_VERSION = "2026-06-20.1";

const STORAGE_KEY = "summer-fair-2026-progress";

const ACTIVITIES = [
  {
    id: "bubble-sort",
    title: "Bubble Sort Beach",
    page: "bubble-sort.html",
    order: 1,
    icon: "🦜",
    duration: "3-6 min",
    description: "Put the sorting steps in the right order to help the beach shells line up.",
    keyPart: "Palm",
    hidden: false,
  },
  {
    id: "algorithm-maze",
    title: "Algorithm Lagoon Maze",
    page: "algorithm-maze.html",
    order: 2,
    icon: "🌴",
    duration: "3-6 min",
    description: "Choose the right algorithmic decisions to escape the island maze.",
    keyPart: "Coral",
    hidden: false,
  },
  {
    id: "code-prediction",
    title: "Code Prediction Cove",
    page: "code-prediction.html",
    order: 3,
    icon: "🐠",
    duration: "3-6 min",
    description: "Read the pseudocode and predict what it will output.",
    keyPart: "Shell",
    hidden: false,
  },
  {
    id: "debugging",
    title: "Debugging Jungle",
    page: "debugging.html",
    order: 4,
    icon: "🦎",
    duration: "3-6 min",
    description: "Spot the errors and repair the logic so the program behaves properly.",
    keyPart: "Sun",
    hidden: false,
  },
  {
    id: "hidden-challenge",
    title: "Hidden Reef Challenge",
    page: "hidden-challenge.html",
    order: 5,
    icon: "🗝️",
    duration: "Up to 6 min",
    description: "Use everything you learned to unlock the final tropical challenge.",
    keyPart: "Treasure",
    hidden: true,
  },
];

/**
 * Read progress from localStorage and normalise missing fields.
 */
function getProgress() {
  const fallback = { completed: {}, activityState: {} };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }

    return {
      completed: typeof parsed.completed === "object" && parsed.completed ? parsed.completed : {},
      activityState: typeof parsed.activityState === "object" && parsed.activityState ? parsed.activityState : {},
    };
  } catch {
    return fallback;
  }
}

function setProgress(progress) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Persist progress after an activity is completed or reset.
 */
function setCompleted(activityId, complete) {
  const progress = getProgress();
  progress.completed[activityId] = Boolean(complete);
  setProgress(progress);
}

function getActivityState(activityId) {
  return getProgress().activityState?.[activityId] ?? null;
}

function setActivityState(activityId, state) {
  const progress = getProgress();
  progress.activityState[activityId] = state;
  setProgress(progress);
}

function clearActivityState(activityId) {
  const progress = getProgress();
  delete progress.activityState[activityId];
  setProgress(progress);
}

/**
 * Hidden challenge unlocks only when all main activities are complete.
 */
function isHiddenUnlocked(progress = getProgress()) {
  return ACTIVITIES.filter((activity) => !activity.hidden).every(
    (activity) => progress.completed[activity.id]
  );
}

function getActivityById(activityId) {
  return ACTIVITIES.find((activity) => activity.id === activityId);
}

function getCompletedCount(progress = getProgress()) {
  return ACTIVITIES.filter((activity) => !activity.hidden && progress.completed[activity.id]).length;
}

function getPageContext() {
  const pageId = document.body.dataset.page || "index";
  return {
    pageId,
    activity: getActivityById(pageId),
    progress: getProgress(),
  };
}

function createStatusChip(icon, title, detail, iconClassName = "status-icon", iconOptions = {}) {
  const chip = document.createElement("section");
  chip.className = "status-chip";
  const gateNameAttribute = iconOptions.gateName ? ` data-gate-name="${iconOptions.gateName}"` : "";
  const iconContent = iconOptions.gateName ? "" : icon;

  chip.innerHTML = `
    <div class="status-chip__body">
      <strong>${title}</strong>
      <span class="status-chip__detail">${detail}</span>
    </div>
    <div class="${iconClassName}"${gateNameAttribute} aria-hidden="true">${iconContent}</div>
  `;

  return chip;
}

function createIndexProgressChip(progress) {
  const chip = document.createElement("section");
  const completedActivities = ACTIVITIES.filter(
    (activity) => !activity.hidden && progress.completed[activity.id]
  );
  const clusterCount = Math.min(4, completedActivities.length);
  const unlocked = isHiddenUnlocked(progress);
  const progressSatisfied = completedActivities.length === ACTIVITIES.filter((activity) => !activity.hidden).length;

  chip.className = "status-chip status-chip--progress";
  chip.innerHTML = `
    <div class="status-chip__body">
      <strong>Progress</strong>
      <span class="status-chip__detail">${completedActivities.length} of 4 main activities complete</span>
    </div>
    <div class="status-chip__visuals" aria-hidden="true">
      <div class="status-chip__summary-icons">
        <div class="status-icon status-icon--progress-collection status-icon--progress-count-${clusterCount} ${progressSatisfied ? "status-icon--complete" : "status-icon--pending"}">
          ${completedActivities.map((activity) => `<span class="status-cluster-token" data-gate-name="${activity.keyPart}" title="${activity.keyPart}"></span>`).join("")}
        </div>
        <div class="status-icon status-icon--lock ${unlocked ? "status-icon--complete" : "status-icon--pending"}">${unlocked ? "🔓" : "🔒"}</div>
      </div>
    </div>
  `;

  return chip;
}

/**
 * Render the shared status display at the top of each page.
 */
function renderStatusBar() {
  const mount = document.querySelector("[data-status-bar]");
  if (!mount) {
    return;
  }

  const { activity, progress } = getPageContext();

  if (!activity) {
    mount.innerHTML = "";
    mount.append(createIndexProgressChip(progress));
    return;
  }

  const completedCount = getCompletedCount(progress);
  const unlocked = isHiddenUnlocked(progress);
  const isCompleted = Boolean(progress.completed[activity.id]);
  const progressSatisfied = isCompleted;
  const progressIcon = progressSatisfied ? "☑" : "☐";
  const progressIconClassName = progressSatisfied ? "status-icon status-icon--complete" : "status-icon status-icon--pending";
  const activityLabel = `Activity ${activity.order} of ${ACTIVITIES.length}`;
  const currentState = activity
    ? isCompleted
      ? "Completed"
      : activity.hidden && !unlocked
        ? "Locked"
        : "Not completed yet"
    : `${completedCount} of 4 main activities complete`;
  const statusIcon = isCompleted
    ? ""
    : activity.hidden && !unlocked
      ? "🔒"
      : "☐";
  const statusIconClassName = isCompleted
    ? "status-icon status-icon--gate"
    : "status-icon status-icon--pending";
  const statusIconOptions = isCompleted ? { gateName: activity.keyPart } : {};

  mount.innerHTML = "";
  mount.append(
    createStatusChip(activity ? activity.icon : "🌺", "Current activity", activityLabel),
    createStatusChip(progressIcon, "Progress", `${completedCount} of 4 main activities complete`, progressIconClassName),
    createStatusChip(statusIcon, "Status", currentState, statusIconClassName, statusIconOptions)
  );
}

function createActivityCard(activity, unlocked) {
  const card = document.createElement(activity.hidden && !unlocked ? "article" : "a");
  const locked = activity.hidden && !unlocked;
  card.className = `activity-card${locked ? " locked" : ""}`;

  if (!locked) {
    card.href = activity.page;
  }

  card.innerHTML = `
    <div class="tag">${activity.icon} ${activity.duration}</div>
    <h2>${activity.title}</h2>
    <p>${activity.description}</p>
    <div class="activity-meta">
      <span class="tag">Key part: ${activity.keyPart}</span>
      <span class="tag">${locked ? "Locked" : "Open"}</span>
    </div>
  `;

  if (locked) {
    const note = document.createElement("p");
    note.className = "locked-note";
    note.textContent = "Finish the four main activities to unlock this page.";
    card.append(note);
  }

  return card;
}

/**
 * Render the activity list on the index page from the central metadata.
 */
function renderActivityList() {
  const mount = document.querySelector("[data-activity-list]");
  if (!mount) {
    return;
  }

  const unlocked = isHiddenUnlocked();
  mount.innerHTML = "";

  ACTIVITIES.forEach((activity) => {
    mount.append(createActivityCard(activity, unlocked));
  });
}

function renderPageCopy() {
  const titleMount = document.querySelector("[data-page-title]");
  const textMount = document.querySelector("[data-page-description]");
  const hintMount = document.querySelector("[data-page-hint]");
  const keyMount = document.querySelector("[data-key-part]");
  const stateMount = document.querySelector("[data-page-state]");

  if (!titleMount || !textMount || !hintMount || !keyMount || !stateMount) {
    return;
  }

  const { activity, progress } = getPageContext();
  if (!activity) {
    return;
  }

  const unlocked = !activity.hidden || isHiddenUnlocked(progress);
  const completed = Boolean(progress.completed[activity.id]);
  titleMount.textContent = activity.title;
  textMount.textContent = activity.description;
  keyMount.textContent = activity.hidden
    ? "Final reward: tropical finale"
    : `Key part reward: ${activity.keyPart}`;

  if (hintMount) {
    hintMount.textContent = unlocked
      ? ""
      : "This challenge stays locked until the four main activities are completed.";
  }

  stateMount.textContent = completed
    ? "Completed"
    : unlocked
      ? "Ready to solve"
      : "Locked until the main challenges are complete";

  const unlockBlock = document.querySelector("[data-hidden-lock]");
  if (unlockBlock) {
    unlockBlock.hidden = unlocked;
  }
}

/**
 * Smoothly scroll a target into view after feedback content changes.
 */
function scrollToFeedback(target) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
    inline: "nearest",
  });
}

/**
 * Refresh the shared page chrome after an activity changes completion state.
 */
function refreshPageChrome() {
  renderStatusBar();
  renderPageCopy();
}

/**
 * Wire up the shared reveal/hide tips block pattern used by activity pages.
 */
function initTipsToggle(page) {
  const tipsBlock = page?.querySelector("[data-tips-block]");
  const toggle = page?.querySelector("[data-tips-toggle]");
  const panel = page?.querySelector("[data-tips-panel]");
  const tipLinks = page?.querySelectorAll('a[href="#tips-section"]');

  if (!tipsBlock || !toggle || !panel) {
    return;
  }

  function setTipsOpen(isOpen) {
    tipsBlock.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));
    toggle.textContent = isOpen ? "Hide -" : "Reveal +";
  }

  toggle.addEventListener("click", () => {
    setTipsOpen(!tipsBlock.classList.contains("is-open"));
  });

  tipLinks?.forEach((link) => {
    link.addEventListener("click", () => {
      setTipsOpen(true);
    });
  });

  if (window.location.hash === "#tips-section") {
    setTipsOpen(true);
  }
}

function renderYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

function init() {
  if (window.summerFairMobileLayout && typeof window.summerFairMobileLayout.init === "function") {
    window.summerFairMobileLayout.init();
  }

  renderYear();
  refreshPageChrome();
  renderActivityList();
}

window.summerFairApp = {
  version: APP_VERSION,
  ACTIVITIES,
  getProgress,
  getActivityById,
  getActivityState,
  setCompleted,
  setActivityState,
  clearActivityState,
  isHiddenUnlocked,
  initTipsToggle,
  refreshPageChrome,
  scrollToFeedback,
};

document.addEventListener("DOMContentLoaded", init);