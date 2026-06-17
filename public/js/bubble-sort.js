/*
 * Bubble Sort activity.
 * This page is the first full use of the shared block assembly engine.
 */

(function () {
  const ACTIVITY_ID = "bubble-sort";
  const DEMO_NUMBERS = [7, 3, 6, 2, 5];
  const LOOP_IDS = ["outer-loop", "inner-loop"];
  const ANIMATION_TIMINGS = {
    compare: 560,
    swap: 1700,
    settle: 420,
    complete: 1650,
  };

  function uniqueNumbers(count, min, max) {
    const values = new Set();

    while (values.size < count) {
      values.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    return [...values];
  }

  function buildFrames(numbers) {
    const values = [...numbers];
    const frames = [{ numbers: [...values], active: [], swapped: false, complete: false, phase: "settle" }];

    for (let pass = 2; pass <= values.length; pass += 1) {
      for (let index = 0; index <= values.length - pass; index += 1) {
        frames.push({ numbers: [...values], active: [index, index + 1], swapped: false, complete: false, phase: "compare" });
        if (values[index] > values[index + 1]) {
          [values[index], values[index + 1]] = [values[index + 1], values[index]];
          frames.push({ numbers: [...values], active: [index, index + 1], swapped: true, complete: false, phase: "swap" });
          frames.push({ numbers: [...values], active: [index, index + 1], swapped: false, complete: false, phase: "settle" });
        }
      }
    }

    frames.push({ numbers: [...values], active: [], swapped: false, complete: true, phase: "complete" });
    return frames;
  }

  function applyChipState(chip, value, frame, index) {
    chip.className = "number-chip";
    chip.dataset.value = String(value);
    chip.textContent = value;

    if (frame.active.includes(index)) {
      chip.classList.add(frame.swapped ? "is-swapped" : "is-active");
      if (frame.phase === "swap") {
        chip.classList.add("is-swap-trace");
      }
    }

    if (frame.complete) {
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
            duration: frame.phase === "swap" ? 1450 : 520,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
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
        ? "transform 1450ms cubic-bezier(0.22, 1, 0.36, 1), background-color 220ms ease, color 220ms ease, box-shadow 220ms ease"
        : "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), background-color 220ms ease, color 220ms ease, box-shadow 220ms ease";

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

  function animateFrames(row, frames) {
    const token = String(Number(row.dataset.animationToken || "0") + 1);
    row.dataset.animationToken = token;

    let elapsed = 0;

    frames.forEach((frame) => {
      window.setTimeout(() => {
        if (row.dataset.animationToken !== token) {
          return;
        }

        renderNumberRow(row, frame);
      }, elapsed);

      elapsed += ANIMATION_TIMINGS[frame.phase] || ANIMATION_TIMINGS.compare;
    });
  }

  function createPieces(numbers) {
    return [
      {
        id: "init",
        kind: "statement",
        kicker: "Setup",
        label: `set numbers to [${numbers.join(", ")}]`,
      },
      {
        id: "outer-loop",
        kind: "container",
        kicker: "Loop",
        label: "loop",
        sockets: [
          {
            key: "header",
            mode: "single",
            label: "Condition",
            emptyLabel: "Drop a condition here",
            acceptKinds: ["condition"],
            acceptFamilies: ["loop"],
          },
          {
            key: "body",
            mode: "sequence",
            label: "Inside this loop",
            emptyLabel: "Drop a card into this loop",
            acceptKinds: ["statement", "container"],
          },
        ],
      },
      {
        id: "outer-condition",
        kind: "condition",
        family: "loop",
        kicker: "Condition",
        label: "for pass from 2 to length(numbers):",
      },
      {
        id: "reset-swapped",
        kind: "statement",
        kicker: "Step",
        label: "set swapped to false",
      },
      {
        id: "inner-loop",
        kind: "container",
        kicker: "Loop",
        label: "loop",
        sockets: [
          {
            key: "header",
            mode: "single",
            label: "Condition",
            emptyLabel: "Drop a condition here",
            acceptKinds: ["condition"],
            acceptFamilies: ["loop"],
          },
          {
            key: "body",
            mode: "sequence",
            label: "Inside this loop",
            emptyLabel: "Drop a card into this loop",
            acceptKinds: ["statement", "container"],
          },
        ],
      },
      {
        id: "inner-condition",
        kind: "condition",
        family: "loop",
        kicker: "Condition",
        label: "for index from 0 to length(numbers) - pass:",
      },
      {
        id: "compare-swap",
        kind: "statement",
        kicker: "Step",
        label: "if numbers[index] > numbers[index + 1], swap them and set swapped to true",
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
      return "Start with the setup card, then think about the repeated work.";
    }

    if (snapshot.root[0] !== "init") {
      return "The setup card usually belongs near the start, before the repeated work.";
    }

    if (rootLoops.length === 0) {
      return "After setup, you still need a loop card to begin the repeating part.";
    }

    if (rootLoops.length > 1) {
      return attemptCount > 0
        ? "Try putting one loop inside the other instead of leaving both at the top."
        : "One loop can sit inside another.";
    }

    if (placedLoops.some((pieceId) => !snapshot.sockets[pieceId]?.header)) {
      return "Each loop needs a condition card attached to it.";
    }

    if (!nestedLoopId) {
      return "One loop can sit inside another so the comparisons repeat inside a bigger repeat.";
    }

    if (
      snapshot.sockets[topLoopId]?.header === "inner-condition" &&
      snapshot.sockets[nestedLoopId]?.header === "outer-condition"
    ) {
      return "Think about which condition controls the bigger repeat and which belongs inside it.";
    }

    if (!getBody(snapshot, topLoopId).includes("reset-swapped")) {
      return "The reset step belongs inside a loop, before the comparison work starts again.";
    }

    if (getBody(snapshot, topLoopId)[0] !== "reset-swapped") {
      return "Inside the bigger repeat, reset before the comparison work.";
    }

    if (!getBody(snapshot, topLoopId).includes(nestedLoopId)) {
      return "The smaller repeat should sit inside the bigger one.";
    }

    if (!getBody(snapshot, nestedLoopId).includes("compare-swap")) {
      return "The compare-and-swap step belongs inside the smaller repeated section.";
    }

    if (getBody(snapshot, nestedLoopId)[0] !== "compare-swap") {
      return "Inside the smaller repeat, the compare-and-swap step should be the work being repeated.";
    }

    return attemptCount > 1
      ? "Check that setup comes first, one loop contains another, and both loops have conditions."
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

    return (
      Boolean(outer) &&
      Boolean(inner) &&
      outer.header === "outer-condition" &&
      JSON.stringify(outer.body) === JSON.stringify(["reset-swapped", nestedLoopId]) &&
      inner.header === "inner-condition" &&
      JSON.stringify(inner.body) === JSON.stringify(["compare-swap"])
    );
  }

  function initBubbleSort() {
    const page = document.querySelector("[data-bubble-sort-page]");
    if (!page || !window.summerFairAssembly || !window.summerFairApp) {
      return;
    }

    const activity = window.summerFairApp.getActivityById(ACTIVITY_ID);
    const puzzleNumbers = uniqueNumbers(6, 1, 25);
    const successFrames = buildFrames(puzzleNumbers);
    const demoFrames = buildFrames(DEMO_NUMBERS);

    const puzzleRow = page.querySelector("[data-puzzle-row]");
    const demoRow = page.querySelector("[data-demo-row]");
    const successRow = page.querySelector("[data-success-row]");
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
    const compactOverviewQuery = window.matchMedia("(max-width: 41.99rem)");

    let failedAttempts = 0;
    let hasSolvedThisAttempt = false;
    let overviewEnabled = compactOverviewQuery.matches;

    keyPartMounts.forEach((node) => {
      node.textContent = activity.keyPart;
    });

    renderNumberRow(puzzleRow, { numbers: puzzleNumbers, active: [], swapped: false, complete: false });
    animateFrames(demoRow, demoFrames);

    const engine = new window.summerFairAssembly.BlockAssemblyEngine({
      paletteMount: page.querySelector("[data-assembly-palette]"),
      workspaceMount: page.querySelector("[data-assembly-workspace]"),
      pieces: createPieces(puzzleNumbers),
      onChange(event) {
        if (event.type === "place" && hasSolvedThisAttempt) {
          hasSolvedThisAttempt = false;
          successPanel.hidden = true;
          stateTag.textContent = "Rebuilding";
          window.summerFairApp.setCompleted(ACTIVITY_ID, false);
          window.summerFairApp.refreshPageChrome();
        }
      },
    });

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
      overviewToggle.setAttribute("aria-pressed", String(enabled));
      overviewToggle.textContent = enabled ? "Overview: on" : "Overview: off";
    }

    function applyBaseState() {
      failedAttempts = 0;
      hasSolvedThisAttempt = false;
      successPanel.hidden = true;
      successPanel.classList.remove("is-celebrating");
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

    overviewToggle?.addEventListener("click", () => {
      if (!compactOverviewQuery.matches) {
        return;
      }

      overviewEnabled = !overviewEnabled;
      renderOverviewToggle();
    });

    checkButton.addEventListener("click", () => {
      const snapshot = engine.getSnapshot();

      if (validate(snapshot)) {
        hasSolvedThisAttempt = true;
        playCelebration();
        setFeedback("Correct. You built a working bubble sort shape.", "success");
        setHint("Great. Watch the shells sort themselves below.");
        stateTag.textContent = "Completed";
        window.summerFairApp.setCompleted(ACTIVITY_ID, true);
        window.summerFairApp.refreshPageChrome();
        animateFrames(successRow, successFrames);
        window.summerFairApp.scrollToFeedback(resultsRegion || feedback);
        return;
      }

      failedAttempts += 1;
      setFeedback("Not quite yet. The structure is still off somewhere.", "error");
      setHint(getAdaptiveHint(snapshot, failedAttempts));
      stateTag.textContent = "Try again";
      window.summerFairApp.scrollToFeedback(resultsRegion || feedback);
    });

    resetButton.addEventListener("click", () => {
      engine.reset();
      window.summerFairApp.setCompleted(ACTIVITY_ID, false);
      window.summerFairApp.refreshPageChrome();
      applyBaseState();
    });

    hintButton.addEventListener("click", () => {
      refreshHint();
    });

    demoReplay.addEventListener("click", () => {
      animateFrames(demoRow, demoFrames);
    });

    successReplay.addEventListener("click", () => {
      playCelebration();
      animateFrames(successRow, successFrames);
    });
  }

  document.addEventListener("DOMContentLoaded", initBubbleSort);
})();