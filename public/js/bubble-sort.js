/*
 * Bubble Sort activity.
 * This page is the first full use of the shared block assembly engine.
 */

(function () {
  const ACTIVITY_ID = "bubble-sort";
  const DEMO_NUMBERS = [7, 3, 6, 2, 5];
  const LOOP_IDS = ["outer-loop", "inner-loop"];
  const ANIMATION_SPEED = 0.85;
  const ANIMATION_TIMINGS = {
    compare: Math.round(560 * ANIMATION_SPEED),
    swap: Math.round(1160 * ANIMATION_SPEED),
    settle: Math.round(420 * ANIMATION_SPEED),
    complete: Math.round(1650 * ANIMATION_SPEED),
  };

  const FLIP_DURATION = {
    compare: Math.round(520 * ANIMATION_SPEED),
    swap: Math.round(1160 * ANIMATION_SPEED),
  };

  const FLIP_EASING = {
    compare: "cubic-bezier(0.22, 1, 0.36, 1)",
    swap: "cubic-bezier(0.16, 0.84, 0.32, 1)",
  };
  const RUN_FOCUS_SCROLL_DELAY = 180;
  const RUN_FOCUS_RESTORE_DELAY = 4000;
  const RUN_FOCUS_VIEWPORT_MARGIN = 28;
  const RUN_FOCUS_MAX_SCALE = 0.75;
  const RUN_FOCUS_MIN_SCALE = 0.24;
  const RUN_FOCUS_MAX_WIDTH_RATIO = 0.56;
  const RUN_FOCUS_MAX_WIDTH_PX = 390;
  const RUN_FOCUS_MIN_WIDTH_PX = 118;

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function uniqueNumbers(count, min, max) {
    const values = new Set();

    while (values.size < count) {
      values.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    return [...values];
  }

  function isValidPuzzleNumbers(value) {
    return Array.isArray(value)
      && value.length === 6
      && value.every((entry) => Number.isInteger(entry))
      && new Set(value).size === value.length;
  }

  function buildFrames(numbers) {
    const values = [...numbers];
    const loopCheckPieces = ["outer-loop", "outer-condition", "inner-loop", "inner-condition"];
    const compareCheckPieces = [...loopCheckPieces, "compare-choice", "compare-condition"];
    const frames = [{ numbers: [...values], active: [], swapped: false, complete: false, completeIndices: [], phase: "settle", activePieces: ["init"] }];

    let completeIndices = [];

    for (let pass = 2; pass <= values.length; pass += 1) {
      for (let index = 0; index <= values.length - pass; index += 1) {
        frames.push({ numbers: [...values], active: [index, index + 1], swapped: false, complete: false, completeIndices: [...completeIndices], phase: "compare", activePieces: [...compareCheckPieces] });
        if (values[index] > values[index + 1]) {
          [values[index], values[index + 1]] = [values[index + 1], values[index]];
          frames.push({ numbers: [...values], active: [index, index + 1], swapped: true, complete: false, completeIndices: [...completeIndices], phase: "swap", activePieces: [...compareCheckPieces, "swap-step"] });
        }
      }

      completeIndices = Array.from({ length: pass - 1 }, (_, offset) => values.length - 1 - offset).reverse();
      frames.push({ numbers: [...values], active: [], swapped: false, complete: false, completeIndices: [...completeIndices], phase: "settle", activePieces: ["outer-loop", "outer-condition"] });
    }

    frames.push({ numbers: [...values], active: [], swapped: false, complete: true, completeIndices: values.map((_, index) => index), phase: "complete", activePieces: [] });
    return frames;
  }

  function applyChipState(chip, value, frame, index) {
    chip.className = "number-chip";
    chip.dataset.value = String(value);

    // Use a shared inner value box so one- and two-digit shells center consistently.
    const valueNode = document.createElement("span");
    valueNode.className = "number-chip__value";
    valueNode.textContent = String(value);
    chip.replaceChildren(valueNode);

    if (frame.active.includes(index)) {
      chip.classList.add(frame.swapped ? "is-swapped" : "is-active");
      if (frame.phase === "swap") {
        chip.classList.add("is-swap-trace");
      }
    }

    if (frame.complete || frame.completeIndices?.includes(index)) {
      chip.classList.add("is-complete");
    }
  }

  function animateChipReorder(row, frame) {
    const previousRects = new Map();
    const previousElements = new Map();

    Array.from(row.children).forEach((chip) => {
      previousRects.set(chip.dataset.value, chip.getBoundingClientRect());
      previousElements.set(chip.dataset.value, chip);
    });

    const nextChips = frame.numbers.map((value, index) => {
      const key = String(value);
      const chip = previousElements.get(key) || document.createElement("div");
      applyChipState(chip, value, frame, index);
      return chip;
    });

    row.replaceChildren(...nextChips);

    nextChips.forEach((chip) => {
      const previousRect = previousRects.get(chip.dataset.value);
      if (!previousRect) {
        return;
      }

      const nextRect = chip.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        return;
      }

      if (typeof chip.animate === "function") {
        chip.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0px, 0px)" },
          ],
          {
            duration: frame.phase === "swap" ? FLIP_DURATION.swap : FLIP_DURATION.compare,
            easing: frame.phase === "swap" ? FLIP_EASING.swap : FLIP_EASING.compare,
            composite: "add",
          },
        );
        return;
      }

      chip.style.transition = "none";
      chip.style.setProperty("--flip-x", `${deltaX}px`);
      chip.style.setProperty("--flip-y", `${deltaY}px`);
      void chip.offsetWidth;
      chip.style.transition = frame.phase === "swap"
        ? `transform ${FLIP_DURATION.swap}ms ${FLIP_EASING.swap}, background-color 180ms ease, color 180ms ease, box-shadow 180ms ease`
        : `transform ${FLIP_DURATION.compare}ms ${FLIP_EASING.compare}, background-color 180ms ease, color 180ms ease, box-shadow 180ms ease`;

      window.requestAnimationFrame(() => {
        chip.style.setProperty("--flip-x", "0px");
        chip.style.setProperty("--flip-y", "0px");
      });
    });
  }

  function renderNumberRow(row, frame) {
    if (row.children.length === 0) {
      frame.numbers.forEach((value, index) => {
        const chip = document.createElement("div");
        applyChipState(chip, value, frame, index);
        row.append(chip);
      });
      return;
    }

    animateChipReorder(row, frame);
  }

  async function animateFrames(row, frames, hooks = {}) {
    const token = String(Number(row.dataset.animationToken || "0") + 1);
    row.dataset.animationToken = token;

    for (const frame of frames) {
      if (row.dataset.animationToken !== token) {
        hooks.onFrameStart?.(null);
        return false;
      }

      hooks.onFrameStart?.(frame);
      renderNumberRow(row, frame);
      await wait(ANIMATION_TIMINGS[frame.phase] || ANIMATION_TIMINGS.compare);
    }

    hooks.onFrameStart?.(null);
    return row.dataset.animationToken === token;
  }

  function createPieces(numbers, vocabulary) {
    const { families, kickers, labels, socketLabels, emptyLabels } = vocabulary;

    return [
      {
        id: "init",
        kind: "statement",
        kicker: kickers.step,
        label: `set numbers to [${numbers.join(", ")}]`,
      },
      {
        id: "outer-loop",
        kind: "container",
        kicker: kickers.repeat,
        label: "",
        sockets: [
          {
            key: "header",
            mode: "single",
            label: socketLabels.repeatHeader,
            emptyLabel: emptyLabels.condition,
            acceptKinds: ["condition"],
            acceptFamilies: [families.repeat],
          },
          {
            key: "body",
            mode: "sequence",
            label: socketLabels.repeatBody,
            emptyLabel: emptyLabels.stepInLoop,
            acceptKinds: ["statement", "container"],
          },
        ],
      },
      {
        id: "outer-condition",
        kind: "condition",
        family: families.repeat,
        kicker: kickers.condition,
        label: "pass from 2 to length(numbers):",
      },
      {
        id: "inner-loop",
        kind: "container",
        kicker: kickers.repeat,
        label: "",
        sockets: [
          {
            key: "header",
            mode: "single",
            label: socketLabels.repeatHeader,
            emptyLabel: emptyLabels.condition,
            acceptKinds: ["condition"],
            acceptFamilies: [families.repeat],
          },
          {
            key: "body",
            mode: "sequence",
            label: socketLabels.repeatBody,
            emptyLabel: emptyLabels.stepInLoop,
            acceptKinds: ["statement", "container"],
          },
        ],
      },
      {
        id: "inner-condition",
        kind: "condition",
        family: families.repeat,
        kicker: kickers.condition,
        label: "index from 0 to length(numbers) - pass:",
      },
      {
        id: "compare-choice",
        kind: "container",
        kicker: kickers.choice,
        label: labels.ifOnly,
        sockets: [
          {
            key: "header",
            mode: "single",
            label: socketLabels.choiceHeader,
            emptyLabel: emptyLabels.condition,
            acceptKinds: ["condition"],
            acceptFamilies: [families.choice],
          },
          {
            key: "ifTrue",
            mode: "sequence",
            label: socketLabels.choiceTrue,
            emptyLabel: emptyLabels.stepInPath,
            acceptKinds: ["statement", "container"],
          },
        ],
      },
      {
        id: "compare-condition",
        kind: "condition",
        family: families.choice,
        kicker: kickers.condition,
        label: "numbers[index] > numbers[index + 1]",
      },
      {
        id: "swap-step",
        kind: "statement",
        kicker: kickers.step,
        label: "swap(numbers, index, index + 1)",
      },
    ];
  }

  function findPiece(snapshot, pieceId) {
    const rootIndex = snapshot.root.indexOf(pieceId);
    if (rootIndex >= 0) {
      return { ownerId: null, socketKey: "root", index: rootIndex };
    }

    for (const [ownerId, sockets] of Object.entries(snapshot.sockets)) {
      for (const [socketKey, value] of Object.entries(sockets)) {
        if (Array.isArray(value)) {
          const index = value.indexOf(pieceId);
          if (index >= 0) {
            return { ownerId, socketKey, index };
          }
        } else if (value === pieceId) {
          return { ownerId, socketKey, index: 0 };
        }
      }
    }

    return null;
  }

  function getBody(snapshot, loopId) {
    return snapshot.sockets[loopId]?.body || [];
  }

  function getAdaptiveHint(snapshot, attemptCount = 0) {
    const rootLoops = snapshot.root.filter((pieceId) => LOOP_IDS.includes(pieceId));
    const placedLoops = LOOP_IDS.filter((pieceId) => Boolean(findPiece(snapshot, pieceId)));
    const topLoopId = rootLoops[0] || null;
    const nestedLoopId = LOOP_IDS.find((pieceId) => {
      const location = findPiece(snapshot, pieceId);
      return pieceId !== topLoopId && location?.ownerId === topLoopId && location?.socketKey === "body";
    });

    if (snapshot.root.length === 0) {
      return "Start with the set numbers step, then think about the repeated work.";
    }

    if (snapshot.root[0] !== "init") {
      return "The set numbers step usually belongs near the start, before the repeated work.";
    }

    if (rootLoops.length === 0) {
      return "After the set numbers step, you still need a repeat block to begin the repeating part.";
    }

    if (rootLoops.length > 1) {
      return attemptCount > 0
        ? "Try putting one repeat block inside the other instead of leaving both at the top."
        : "One repeat block can sit inside another.";
    }

    if (placedLoops.some((pieceId) => !snapshot.sockets[pieceId]?.header)) {
      return "Each repeat block needs a condition attached to it.";
    }

    if (!nestedLoopId) {
      return "One repeat block can sit inside another so the comparisons repeat inside a bigger repeat.";
    }

    if (
      snapshot.sockets[topLoopId]?.header === "inner-condition" &&
      snapshot.sockets[nestedLoopId]?.header === "outer-condition"
    ) {
      return "Think about which condition controls the bigger repeat and which belongs inside it.";
    }

    if (!getBody(snapshot, topLoopId).includes(nestedLoopId)) {
      return "The smaller repeat should sit inside the bigger one.";
    }

    if (!getBody(snapshot, nestedLoopId).includes("compare-choice")) {
      return "The choice block belongs inside the smaller repeated section.";
    }

    if (getBody(snapshot, nestedLoopId)[0] !== "compare-choice") {
      return "Inside the smaller repeat, use the choice block before anything else.";
    }

    const compareChoice = snapshot.sockets["compare-choice"] || {};
    if (compareChoice.header !== "compare-condition") {
      return "The choice block needs the comparison condition in its if slot.";
    }

    if (!(compareChoice.ifTrue || []).includes("swap-step")) {
      return "Swapping only happens inside the choice block's true path.";
    }

    if ((compareChoice.ifTrue || [])[0] !== "swap-step") {
      return "Place the swap step inside the choice block's true path.";
    }

    return attemptCount > 1
      ? "Check that the set numbers step comes first, one repeat block contains another, and both repeat blocks have conditions."
      : "You are close. Check what happens first, then what repeats inside what.";
  }

  function validate(snapshot) {
    if (snapshot.root.length !== 2 || snapshot.root[0] !== "init") {
      return false;
    }

    const topLoopId = snapshot.root[1];
    if (!LOOP_IDS.includes(topLoopId)) {
      return false;
    }

    const nestedLoopId = LOOP_IDS.find((pieceId) => pieceId !== topLoopId);
    const outer = snapshot.sockets[topLoopId];
    const inner = snapshot.sockets[nestedLoopId];
    const compare = snapshot.sockets["compare-choice"];

    return (
      Boolean(outer) &&
      Boolean(inner) &&
      Boolean(compare) &&
      outer.header === "outer-condition" &&
      JSON.stringify(outer.body) === JSON.stringify([nestedLoopId]) &&
      inner.header === "inner-condition" &&
      JSON.stringify(inner.body) === JSON.stringify(["compare-choice"]) &&
      compare.header === "compare-condition" &&
      JSON.stringify(compare.ifTrue || []) === JSON.stringify(["swap-step"])
    );
  }

  function initBubbleSort() {
    const page = document.querySelector("[data-bubble-sort-page]");
    if (!page || !window.summerFairAssembly || !window.summerFairApp) {
      return;
    }

    window.summerFairApp.initTipsToggle(page);

    const activity = window.summerFairApp.getActivityById(ACTIVITY_ID);
    const savedActivityState = window.summerFairApp.getActivityState(ACTIVITY_ID);
    const puzzleNumbers = isValidPuzzleNumbers(savedActivityState?.puzzleNumbers)
      ? [...savedActivityState.puzzleNumbers]
      : uniqueNumbers(6, 1, 25);
    const successFrames = buildFrames(puzzleNumbers);
    const demoFrames = buildFrames(DEMO_NUMBERS);

    const puzzleRow = page.querySelector("[data-puzzle-row]");
    const demoRow = page.querySelector("[data-demo-row]");
    const successRow = page.querySelector("[data-success-row]");
    const runFocusHost = page.querySelector("[data-run-focus-host]");
    const assemblyLayout = page.querySelector(".assembly-layout");
    const workspaceColumn = page.querySelector("[data-assembly-workspace-column]");
    const runStage = page.querySelector("[data-run-focus-stage]");
    const workspaceDock = page.querySelector("[data-run-focus-workspace-dock]");
    const resultsRegion = page.querySelector("[data-bubble-results]");
    const feedback = page.querySelector("[data-bubble-feedback]");
    const hint = page.querySelector("[data-bubble-hint]");
    const stateTag = page.querySelector("[data-bubble-state]");
    const successPanel = page.querySelector("[data-bubble-success]");
    const keyPartMounts = page.querySelectorAll("[data-bubble-key-part], [data-bubble-key-part-repeat]");
    const overviewToggle = page.querySelector("[data-overview-toggle]");
    const checkButton = page.querySelector("[data-check-order]");
    const resetButton = page.querySelector("[data-reset-order]");
    const hintButton = page.querySelector("[data-show-hint]");
    const demoReplay = page.querySelector("[data-demo-replay]");
    const successReplay = page.querySelector("[data-success-replay]");
    const compactOverviewQuery = window.matchMedia("(max-width: 63.99rem)");
    const runFocus = window.summerFairApp.createRunFocusController({
      page,
      runStage,
      assemblyLayout,
      workspaceColumn,
      workspaceDock,
      viewportMargin: RUN_FOCUS_VIEWPORT_MARGIN,
      maxScale: RUN_FOCUS_MAX_SCALE,
      minScale: RUN_FOCUS_MIN_SCALE,
      maxWidthRatio: RUN_FOCUS_MAX_WIDTH_RATIO,
      maxWidthPx: RUN_FOCUS_MAX_WIDTH_PX,
      minWidthPx: RUN_FOCUS_MIN_WIDTH_PX,
    });

    let failedAttempts = 0;
    let hasSolvedThisAttempt = false;
    let isRunning = false;
    let overviewEnabled = compactOverviewQuery.matches;

    keyPartMounts.forEach((node) => {
      node.textContent = activity.keyPart;
    });

    renderNumberRow(puzzleRow, { numbers: puzzleNumbers, active: [], swapped: false, complete: false });
    animateFrames(demoRow, demoFrames);

    const vocabulary = window.summerFairAssembly.vocabulary;
    const engine = new window.summerFairAssembly.BlockAssemblyEngine({
      paletteMount: page.querySelector("[data-assembly-palette]"),
      workspaceMount: page.querySelector("[data-assembly-workspace]"),
      pieces: createPieces(puzzleNumbers, vocabulary),
      onChange(event) {
        if (event.type === "reject") {
          setFeedback(event.message, "error");
          return;
        }

        if (event.type === "place" && hasSolvedThisAttempt) {
          hasSolvedThisAttempt = false;
          successPanel.hidden = true;
          stateTag.textContent = "Rebuilding";
          window.summerFairApp.setCompleted(ACTIVITY_ID, false);
          window.summerFairApp.refreshPageChrome();
        }

        if (["place", "reset"].includes(event.type)) {
          clearRunHighlight();
          runFocus.setEnabled(false);
        }

        window.summerFairApp.setActivityState(ACTIVITY_ID, {
          puzzleNumbers: [...puzzleNumbers],
          assemblySnapshot: engine.getSnapshot(),
        });
      },
    });

    if (savedActivityState?.assemblySnapshot) {
      engine.restoreSnapshot(savedActivityState.assemblySnapshot);
    }

    function setFeedback(message, tone) {
      feedback.textContent = message;
      feedback.classList.remove("is-error", "is-success");
      if (tone === "error") {
        feedback.classList.add("is-error");
      }
      if (tone === "success") {
        feedback.classList.add("is-success");
      }
    }

    function setHint(message) {
      hint.textContent = message;
    }

    function setBusy(isBusy) {
      isRunning = isBusy;
      [checkButton, resetButton, hintButton, demoReplay, successReplay, overviewToggle].forEach((button) => {
        if (button) {
          button.disabled = isBusy || (button === overviewToggle && !compactOverviewQuery.matches);
        }
      });
    }

    function clearRunHighlight() {
      page.querySelectorAll(".assembly-piece.is-running").forEach((piece) => {
        piece.classList.remove("is-running");
      });
    }

    function setRunHighlight(pieceIds) {
      clearRunHighlight();
      if (!pieceIds || pieceIds.length === 0) {
        return;
      }

      pieceIds.forEach((pieceId) => {
        page.querySelectorAll(`[data-piece-id="${pieceId}"]`).forEach((piece) => {
          piece.classList.add("is-running");
        });
      });
    }

    function scrollRunStageIntoView() {
      const target = runFocusHost || resultsRegion || feedback || puzzleRow;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - 12);
      window.scrollTo({
        top,
        behavior: "auto",
      });
    }

    function refreshHint() {
      setHint(getAdaptiveHint(engine.getSnapshot(), failedAttempts));
    }

    function playCelebration() {
      successPanel.hidden = false;
      successPanel.classList.remove("is-celebrating");
      void successPanel.offsetWidth;
      successPanel.classList.add("is-celebrating");
    }

    function renderOverviewToggle() {
      if (!overviewToggle) {
        return;
      }

      const enabled = compactOverviewQuery.matches && overviewEnabled;
      page.classList.toggle("is-assembly-overview", enabled);
      overviewToggle.disabled = !compactOverviewQuery.matches;
      overviewToggle.setAttribute("aria-pressed", String(enabled));
      overviewToggle.textContent = compactOverviewQuery.matches ? (enabled ? "Overview: on" : "Overview: off") : "Overview unavailable";
    }

    function applyBaseState() {
      failedAttempts = 0;
      hasSolvedThisAttempt = false;
      successPanel.hidden = true;
      successPanel.classList.remove("is-celebrating");
      clearRunHighlight();
      runFocus.setEnabled(false);
      renderNumberRow(successRow, { numbers: puzzleNumbers, active: [], swapped: false, complete: false });
      setFeedback("Arrange the pieces, then check whether your structure matches the bubble sort program.", null);
      setHint("Hints will nudge you without revealing the full answer.");
      stateTag.textContent = window.summerFairApp.getProgress().completed[ACTIVITY_ID]
        ? "Completed earlier"
        : "Ready to build";
    }

    applyBaseState();
    renderOverviewToggle();

    const handleOverviewMediaChange = (event) => {
      overviewEnabled = event.matches;
      renderOverviewToggle();
    };

    if (typeof compactOverviewQuery.addEventListener === "function") {
      compactOverviewQuery.addEventListener("change", handleOverviewMediaChange);
    } else if (typeof compactOverviewQuery.addListener === "function") {
      compactOverviewQuery.addListener(handleOverviewMediaChange);
    }

    const handleRunFocusViewportChange = () => {
      if (!runFocus.isEnabled()) {
        return;
      }

      runFocus.updateMetrics();
    };

    window.addEventListener("resize", handleRunFocusViewportChange);
    if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
      window.visualViewport.addEventListener("resize", handleRunFocusViewportChange);
    }

    overviewToggle?.addEventListener("click", () => {
      if (!compactOverviewQuery.matches || isRunning) {
        return;
      }

      overviewEnabled = !overviewEnabled;
      renderOverviewToggle();
    });

    async function playSolutionAnimation() {
      setBusy(true);
      runFocus.setEnabled(true);
      scrollRunStageIntoView();
      await wait(RUN_FOCUS_SCROLL_DELAY);

      try {
        await animateFrames(successRow, successFrames, {
          onFrameStart(frame) {
            setRunHighlight(frame?.activePieces || []);
          },
        });
        await wait(RUN_FOCUS_RESTORE_DELAY);
      } finally {
        clearRunHighlight();
        runFocus.setEnabled(false);
        setBusy(false);
        renderOverviewToggle();
      }
    }

    checkButton.addEventListener("click", async () => {
      if (isRunning) {
        return;
      }

      const snapshot = engine.getSnapshot();

      if (validate(snapshot)) {
        hasSolvedThisAttempt = true;
        playCelebration();
        setFeedback("Correct. You built a working bubble sort shape.", "success");
        setHint("Great. Watch the shells sort themselves below.");
        stateTag.textContent = "Completed";
        window.summerFairApp.setCompleted(ACTIVITY_ID, true);
        window.summerFairApp.refreshPageChrome();
        window.summerFairApp.scrollToFeedback(resultsRegion || feedback);
        await playSolutionAnimation();
        return;
      }

      failedAttempts += 1;
      setFeedback("Not quite yet. The structure is still off somewhere.", "error");
      setHint(getAdaptiveHint(snapshot, failedAttempts));
      stateTag.textContent = "Try again";
      window.summerFairApp.scrollToFeedback(resultsRegion || feedback);
    });

    resetButton.addEventListener("click", () => {
      if (isRunning) {
        return;
      }

      engine.reset();
      window.summerFairApp.setCompleted(ACTIVITY_ID, false);
      window.summerFairApp.refreshPageChrome();
      applyBaseState();
    });

    hintButton.addEventListener("click", () => {
      if (isRunning) {
        return;
      }

      refreshHint();
    });

    demoReplay.addEventListener("click", () => {
      if (isRunning) {
        return;
      }

      animateFrames(demoRow, demoFrames);
    });

    successReplay.addEventListener("click", async () => {
      if (isRunning) {
        return;
      }

      playCelebration();
      await playSolutionAnimation();
    });
  }

  document.addEventListener("DOMContentLoaded", initBubbleSort);
})();