/*
 * Summer Fair 2026 shared client-side logic.
 * Slice 1 centralises page metadata, progress state and shared rendering helpers.
 * Version: 2026-06-20.2
 */

const APP_VERSION = "2026-06-20.2";

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
    available: false,
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
    available: false,
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

function isActivityAvailable(activity) {
  return activity?.available !== false;
}

function getUnlockActivities() {
  return ACTIVITIES.filter((activity) => !activity.hidden && isActivityAvailable(activity));
}

function formatActivityTitleList(activities) {
  const titles = activities.map((activity) => activity.title);

  if (titles.length <= 1) {
    return titles[0] || "the live challenges";
  }

  if (titles.length === 2) {
    return `${titles[0]} and ${titles[1]}`;
  }

  return `${titles.slice(0, -1).join(", ")}, and ${titles[titles.length - 1]}`;
}

function getUnlockRequirementLabel() {
  return formatActivityTitleList(getUnlockActivities());
}

function getUnlockRequirementVerb() {
  return getUnlockActivities().length === 1 ? "is" : "are";
}

function getUnlockTargetCount() {
  return getUnlockActivities().length;
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
  return getUnlockActivities().every(
    (activity) => progress.completed[activity.id]
  );
}

function getActivityById(activityId) {
  return ACTIVITIES.find((activity) => activity.id === activityId);
}

function getGateIcon(keyPart) {
  switch (keyPart) {
    case "Palm":
      return "🌴";
    case "Coral":
      return "🪸";
    case "Shell":
      return "🐚";
    case "Sun":
      return "☀️";
    case "Treasure":
      return "💎";
    default:
      return "🗝️";
  }
}

function getCompletedCount(progress = getProgress()) {
  return getUnlockActivities().filter((activity) => progress.completed[activity.id]).length;
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
  const bodySupplement = iconOptions.bodySupplement || "";

  chip.innerHTML = `
    <div class="status-chip__body">
      <strong>${title}</strong>
      <span class="status-chip__detail">${detail}</span>
      ${bodySupplement}
    </div>
    <div class="${iconClassName}"${gateNameAttribute} aria-hidden="true">${iconContent}</div>
  `;

  return chip;
}

function createIndexProgressChip(progress) {
  const chip = document.createElement("section");
  const unlockActivities = getUnlockActivities();
  const completedActivities = unlockActivities.filter((activity) => progress.completed[activity.id]);
  const clusterCount = Math.min(4, completedActivities.length);
  const unlocked = isHiddenUnlocked(progress);
  const progressSatisfied = completedActivities.length === unlockActivities.length;

  chip.className = "status-chip status-chip--progress";
  chip.innerHTML = `
    <div class="status-chip__body">
      <strong>Progress</strong>
      <span class="status-chip__detail">${completedActivities.length} of ${unlockActivities.length} live challenges complete</span>
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
  const available = isActivityAvailable(activity);
  const progressSatisfied = isCompleted;
  const progressIcon = progressSatisfied ? "☑" : "☐";
  const progressIconClassName = progressSatisfied ? "status-icon status-icon--complete" : "status-icon status-icon--pending";
  const activityLabel = `Activity ${activity.order} of ${ACTIVITIES.length}`;
  const activitySupplement = isCompleted
    ? `<span class="status-chip__meta status-chip__meta--completion"><span class="status-chip__meta-icon" aria-hidden="true">${getGateIcon(activity.keyPart)}</span><span>Completed</span></span>`
    : !available
      ? '<span class="status-chip__meta status-chip__meta--soon">Coming soon</span>'
    : activity.hidden && !unlocked
      ? '<span class="status-chip__meta status-chip__meta--locked">Locked</span>'
      : "";

  mount.innerHTML = "";
  mount.append(
    createStatusChip(activity ? activity.icon : "🌺", "Current activity", activityLabel, "status-icon", {
      bodySupplement: activitySupplement,
    }),
    createStatusChip(progressIcon, "Progress", `${completedCount} of ${getUnlockTargetCount()} live challenges complete`, progressIconClassName)
  );
}

function createActivityCard(activity, unlocked) {
  const comingSoon = !activity.hidden && !isActivityAvailable(activity);
  const locked = activity.hidden && !unlocked;
  const inactive = locked || comingSoon;
  const card = document.createElement(inactive ? "article" : "a");
  card.className = `activity-card${locked ? " locked" : ""}${comingSoon ? " activity-card--soon" : ""}`;

  if (!inactive) {
    card.href = activity.page;
  }

  if (inactive) {
    card.setAttribute("aria-disabled", "true");
  }

  card.innerHTML = `
    <div class="tag">${activity.icon} ${activity.duration}</div>
    <h2>${activity.title}</h2>
    <p>${activity.description}</p>
    <div class="activity-meta">
      <span class="tag">Key part: ${activity.keyPart}</span>
      <span class="tag">${comingSoon ? "Coming soon" : locked ? "Locked" : "Open"}</span>
    </div>
  `;

  if (locked || comingSoon) {
    const note = document.createElement("p");
    note.className = "locked-note";
    note.textContent = comingSoon
      ? "This challenge is not open yet."
      : `Finish ${getUnlockRequirementLabel()} to unlock this page.`;
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

  const available = isActivityAvailable(activity);
  const unlockRequirementLabel = getUnlockRequirementLabel();
  const unlockRequirementVerb = getUnlockRequirementVerb();
  const unlocked = available && (!activity.hidden || isHiddenUnlocked(progress));
  const completed = Boolean(progress.completed[activity.id]);
  titleMount.textContent = activity.title;
  textMount.textContent = activity.description;
  keyMount.textContent = activity.hidden
    ? "Bonus reward: tropical finale"
    : `Key part reward: ${activity.keyPart}`;

  if (hintMount) {
    hintMount.textContent = !available
      ? "This challenge is coming soon and is not open yet."
      : unlocked
        ? ""
        : `This challenge stays locked until ${unlockRequirementLabel} ${unlockRequirementVerb} completed.`;
  }

  stateMount.textContent = completed
    ? "Completed"
    : !available
      ? "Coming soon"
      : unlocked
        ? "Ready to solve"
        : "Locked until the live challenges are complete";

  const hiddenPreview = document.querySelector("[data-hidden-preview]");
  if (hiddenPreview && activity.hidden) {
    hiddenPreview.textContent = unlocked
      ? "The bonus reef challenge is unlocked and ready for its final build."
      : `The bonus reef challenge will appear here once ${unlockRequirementLabel} ${unlockRequirementVerb} completed.`;
  }

  const hiddenLockCopy = document.querySelector("[data-hidden-lock-copy]");
  if (hiddenLockCopy && activity.hidden) {
    hiddenLockCopy.textContent = unlocked
      ? ""
      : `This challenge is still locked. Complete ${unlockRequirementLabel} first.`;
  }

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
 * Move the assembly workspace beside a live puzzle area and scale it to fit the viewport.
 */
function createRunFocusController({
  page,
  runStage,
  assemblyLayout,
  workspaceColumn,
  workspaceDock,
  resultsRegion,
  resultsDock,
  resultsHome,
  viewportMargin = 28,
  maxScale = 0.55,
  minScale = 0.24,
  maxWidthRatio = 0.39,
  maxWidthPx = 276,
  minWidthPx = 118,
} = {}) {
  let workspaceMetrics = null;
  const canRelocateResults = resultsRegion instanceof HTMLElement
    && resultsDock instanceof HTMLElement
    && resultsHome instanceof HTMLElement;
  const propertyNames = [
    "--run-focus-workspace-scale",
    "--run-focus-workspace-width",
    "--run-focus-workspace-height",
    "--run-focus-workspace-natural-width",
  ];

  function hasRequiredElements() {
    return page instanceof HTMLElement
      && runStage instanceof HTMLElement
      && assemblyLayout instanceof HTMLElement
      && workspaceColumn instanceof HTMLElement
      && workspaceDock instanceof HTMLElement;
  }

  function captureWorkspaceMetrics() {
    if (!(workspaceColumn instanceof HTMLElement)) {
      return null;
    }

    const rect = workspaceColumn.getBoundingClientRect();
    return {
      width: Math.max(workspaceColumn.offsetWidth, Math.round(rect.width)),
      height: Math.max(workspaceColumn.offsetHeight, Math.round(rect.height)),
    };
  }

  function clearWorkspaceMetrics() {
    workspaceMetrics = null;
    if (!(page instanceof HTMLElement)) {
      return;
    }

    propertyNames.forEach((propertyName) => {
      page.style.removeProperty(propertyName);
    });
  }

  function updateMetrics() {
    if (!hasRequiredElements() || !page.classList.contains("is-run-focus") || !workspaceMetrics) {
      return;
    }

    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const availableHeight = Math.max(160, viewportHeight - viewportMargin);
    const widthCap = Math.min(
      maxWidthPx,
      Math.max(minWidthPx, viewportWidth * maxWidthRatio)
    );
    const scale = Math.max(
      minScale,
      Math.min(
        maxScale,
        availableHeight / workspaceMetrics.height,
        widthCap / workspaceMetrics.width
      )
    );
    const scaledWidth = Math.max(minWidthPx, Math.round(workspaceMetrics.width * scale));
    const scaledHeight = Math.max(120, Math.round(workspaceMetrics.height * scale));

    page.style.setProperty("--run-focus-workspace-scale", scale.toFixed(4));
    page.style.setProperty("--run-focus-workspace-width", `${scaledWidth}px`);
    page.style.setProperty("--run-focus-workspace-height", `${scaledHeight}px`);
    page.style.setProperty("--run-focus-workspace-natural-width", `${workspaceMetrics.width}px`);
  }

  function setEnabled(enabled) {
    const canEnable = Boolean(enabled) && hasRequiredElements();

    if (page instanceof HTMLElement) {
      page.classList.toggle("is-run-focus", canEnable);
    }

    if (!hasRequiredElements()) {
      return false;
    }

    if (canEnable) {
      workspaceMetrics = captureWorkspaceMetrics();

      if (workspaceColumn.parentElement !== workspaceDock) {
        workspaceDock.append(workspaceColumn);
      }

      if (canRelocateResults && resultsRegion.parentElement !== resultsDock) {
        resultsDock.append(resultsRegion);
      }

      updateMetrics();
      return true;
    }

    clearWorkspaceMetrics();

    if (workspaceColumn.parentElement !== assemblyLayout) {
      assemblyLayout.append(workspaceColumn);
    }

    if (canRelocateResults && resultsRegion.parentElement !== resultsHome) {
      resultsHome.append(resultsRegion);
    }

    return false;
  }

  return {
    setEnabled,
    updateMetrics,
    clearWorkspaceMetrics,
    isEnabled() {
      return page instanceof HTMLElement && page.classList.contains("is-run-focus");
    },
  };
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

function renderFooter() {
  document.querySelectorAll("[data-site-footer]").forEach((mount) => {
    mount.innerHTML = `
      <p class="footer-note">
        Digital/Computing learning activities for Southampton College Summer Fair <span data-year></span>. Created by Joe Hudson.
      </p>
    `;
  });
}

function init() {
  if (window.summerFairMobileLayout && typeof window.summerFairMobileLayout.init === "function") {
    window.summerFairMobileLayout.init();
  }

  renderFooter();
  renderYear();
  refreshPageChrome();
  renderActivityList();
}

window.summerFairApp = {
  version: APP_VERSION,
  ACTIVITIES,
  createRunFocusController,
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