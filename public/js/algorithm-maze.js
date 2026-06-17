/*
 * Algorithm Maze activity.
 * This slice reuses the shared block assembly engine with a fixed maze and a small interpreter.
 */

(function () {
  const ACTIVITY_ID = "algorithm-maze";
  const DIRECTION_ORDER = ["north", "east", "south", "west"];
  const DIRECTION_VECTORS = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 },
  };
  const LOOP_ID = "repeat-loop";
  const BRANCH_ID = "branch-check";
  const ANIMATION_MS = {
    move: 420,
    turn: 260,
    pause: 80,
  };
  const DEMO_MAZE = {
    cols: 3,
    rows: 3,
    cellSize: 64,
    padding: 28,
    start: { x: 0, y: 1, direction: "east" },
    finish: { x: 1, y: 2 },
    edges: [
      [{ x: 0, y: 1 }, { x: 1, y: 1 }],
      [{ x: 1, y: 1 }, { x: 1, y: 2 }],
    ],
  };
  const PUZZLE_MAZE = {
    cols: 6,
    rows: 4,
    cellSize: 52,
    padding: 30,
    start: { x: 0, y: 1, direction: "east" },
    finish: { x: 5, y: 2 },
    edges: [
      [{ x: 0, y: 1 }, { x: 1, y: 1 }],
      [{ x: 1, y: 1 }, { x: 2, y: 1 }],
      [{ x: 2, y: 1 }, { x: 3, y: 1 }],
      [{ x: 3, y: 1 }, { x: 4, y: 1 }],
      [{ x: 4, y: 1 }, { x: 5, y: 1 }],
      [{ x: 4, y: 1 }, { x: 4, y: 2 }],
      [{ x: 4, y: 2 }, { x: 5, y: 2 }],
    ],
  };
  const DEMO_COMMANDS = ["move-forward", "turn-right", "move-forward"];

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function cellKey(cell) {
    return `${cell.x},${cell.y}`;
  }

  function clonePosition(position) {
    return { x: position.x, y: position.y, direction: position.direction };
  }

  function buildAdjacency(maze) {
    const adjacency = new Map();

    const add = (from, to) => {
      const key = cellKey(from);
      if (!adjacency.has(key)) {
        adjacency.set(key, []);
      }

      adjacency.get(key).push({ x: to.x, y: to.y });
    };

    maze.edges.forEach(([from, to]) => {
      add(from, to);
      add(to, from);
    });

    return adjacency;
  }

  function getMazeMetrics(maze) {
    return {
      width: maze.padding * 2 + maze.cellSize * (maze.cols - 1),
      height: maze.padding * 2 + maze.cellSize * (maze.rows - 1),
    };
  }

  function toPixel(maze, x, y) {
    return {
      x: maze.padding + x * maze.cellSize,
      y: maze.padding + y * maze.cellSize,
    };
  }

  function toPercent(maze, position) {
    const metrics = getMazeMetrics(maze);
    const pixel = toPixel(maze, position.x, position.y);
    return {
      left: `${(pixel.x / metrics.width) * 100}%`,
      top: `${(pixel.y / metrics.height) * 100}%`,
    };
  }

  function getRotation(direction) {
    return `${DIRECTION_ORDER.indexOf(direction) * 90}deg`;
  }

  function rotateDirection(direction, turn) {
    const index = DIRECTION_ORDER.indexOf(direction);
    const delta = turn === "right" ? 1 : -1;
    return DIRECTION_ORDER[(index + delta + DIRECTION_ORDER.length) % DIRECTION_ORDER.length];
  }

  function getRelativeDirection(direction, relative) {
    if (relative === "forward") {
      return direction;
    }

    return rotateDirection(direction, relative === "right" ? "right" : "left");
  }

  function getTargetCell(position, relative) {
    const absoluteDirection = getRelativeDirection(position.direction, relative);
    const vector = DIRECTION_VECTORS[absoluteDirection];

    return {
      x: position.x + vector.x,
      y: position.y + vector.y,
    };
  }

  function hasEdge(adjacency, from, to) {
    return (adjacency.get(cellKey(from)) || []).some((cell) => cell.x === to.x && cell.y === to.y);
  }

  function isAtFinish(maze, position) {
    return position.x === maze.finish.x && position.y === maze.finish.y;
  }

  function createPieces() {
    return [
      {
        id: LOOP_ID,
        kind: "container",
        kicker: "Loop",
        label: "repeat",
        sockets: [
          {
            key: "header",
            mode: "single",
            label: "Condition",
            emptyLabel: "Drop a loop condition here",
            acceptKinds: ["condition"],
            acceptFamilies: ["repeat"],
          },
          {
            key: "body",
            mode: "sequence",
            label: "Inside this loop",
            emptyLabel: "Drop a step into this loop",
            acceptKinds: ["statement", "container"],
          },
        ],
      },
      {
        id: "repeat-4",
        kind: "condition",
        family: "repeat",
        kicker: "Condition",
        label: "repeat 4 times",
      },
      {
        id: "repeat-3",
        kind: "condition",
        family: "repeat",
        kicker: "Condition",
        label: "repeat 3 times",
      },
      {
        id: BRANCH_ID,
        kind: "container",
        kicker: "Choice",
        label: "if ... then ... else ...",
        sockets: [
          {
            key: "header",
            mode: "single",
            label: "Condition",
            emptyLabel: "Drop a choice condition here",
            acceptKinds: ["condition"],
            acceptFamilies: ["branch"],
          },
          {
            key: "ifTrue",
            mode: "sequence",
            label: "If true",
            emptyLabel: "Drop a step into this path",
            acceptKinds: ["statement", "container"],
          },
          {
            key: "otherwise",
            mode: "sequence",
            label: "Otherwise",
            emptyLabel: "Optional other path",
            acceptKinds: ["statement", "container"],
          },
        ],
      },
      {
        id: "branch-right",
        kind: "condition",
        family: "branch",
        kicker: "Condition",
        label: "if there is a path to the right",
      },
      {
        id: "branch-left",
        kind: "condition",
        family: "branch",
        kicker: "Condition",
        label: "if there is a path to the left",
      },
      {
        id: "forward-loop",
        kind: "statement",
        kicker: "Step",
        label: "move forward",
      },
      {
        id: "turn-right",
        kind: "statement",
        kicker: "Step",
        label: "turn right",
      },
      {
        id: "forward-after-branch",
        kind: "statement",
        kicker: "Step",
        label: "move forward",
      },
      {
        id: "turn-left",
        kind: "statement",
        kicker: "Step",
        label: "turn left",
      },
      {
        id: "forward-finish",
        kind: "statement",
        kicker: "Step",
        label: "move forward",
      },
    ];
  }

  function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
    return element;
  }

  function renderMazeBoard(mount, maze, className = "") {
    mount.innerHTML = "";
    const frame = document.createElement("div");
    frame.className = `maze-board__frame${className ? ` ${className}` : ""}`;

    const metrics = getMazeMetrics(maze);
    const svg = createSvgElement("svg", {
      class: "maze-board__svg",
      viewBox: `0 0 ${metrics.width} ${metrics.height}`,
      role: "img",
      "aria-hidden": "true",
    });

    [
      { cx: metrics.width * 0.12, cy: metrics.height * 0.14, r: 18 },
      { cx: metrics.width * 0.86, cy: metrics.height * 0.22, r: 14 },
      { cx: metrics.width * 0.78, cy: metrics.height * 0.82, r: 20 },
      { cx: metrics.width * 0.24, cy: metrics.height * 0.76, r: 12 },
    ].forEach((dot) => {
      svg.append(createSvgElement("circle", { class: "maze-water-dot", ...dot }));
    });

    maze.edges.forEach(([from, to]) => {
      const start = toPixel(maze, from.x, from.y);
      const end = toPixel(maze, to.x, to.y);
      svg.append(createSvgElement("line", { class: "maze-trail-base", x1: start.x, y1: start.y, x2: end.x, y2: end.y }));
      svg.append(createSvgElement("line", { class: "maze-trail-top", x1: start.x, y1: start.y, x2: end.x, y2: end.y }));
    });

    const nodes = new Map();
    maze.edges.flat().forEach((cell) => {
      nodes.set(cellKey(cell), cell);
    });
    nodes.set(cellKey(maze.start), maze.start);
    nodes.set(cellKey(maze.finish), maze.finish);

    nodes.forEach((cell) => {
      const pixel = toPixel(maze, cell.x, cell.y);
      svg.append(createSvgElement("circle", { class: "maze-trail-node", cx: pixel.x, cy: pixel.y, r: 10 }));
    });

    const startPixel = toPixel(maze, maze.start.x, maze.start.y);
    svg.append(createSvgElement("rect", { class: "maze-start-badge", x: startPixel.x - 28, y: startPixel.y - 34, rx: 10, ry: 10, width: 56, height: 20 }));
    const startLabel = createSvgElement("text", { class: "maze-label", x: startPixel.x, y: startPixel.y - 20, "text-anchor": "middle" });
    startLabel.textContent = "Start";
    svg.append(startLabel);

    const finishPixel = toPixel(maze, maze.finish.x, maze.finish.y);
    svg.append(createSvgElement("rect", { class: "maze-finish-badge", x: finishPixel.x - 30, y: finishPixel.y + 12, rx: 10, ry: 10, width: 60, height: 20 }));
    const finishLabel = createSvgElement("text", { class: "maze-label maze-finish-label", x: finishPixel.x, y: finishPixel.y + 27, "text-anchor": "middle" });
    finishLabel.textContent = "Finish";
    svg.append(finishLabel);

    const explorer = document.createElement("div");
    explorer.className = "maze-explorer";
    explorer.setAttribute("aria-hidden", "true");

    frame.append(svg, explorer);
    mount.append(frame);
    return explorer;
  }

  function placeExplorer(explorer, maze, position, state = "idle") {
    const coords = toPercent(maze, position);
    explorer.style.setProperty("--maze-x", coords.left);
    explorer.style.setProperty("--maze-y", coords.top);
    explorer.style.setProperty("--maze-rotation", getRotation(position.direction));
    explorer.classList.toggle("is-stuck", state === "stuck");
    explorer.classList.toggle("is-finished", state === "finished");
  }

  function getHint(snapshot, attempts = 0) {
    const loopPlaced = snapshot.root.includes(LOOP_ID);
    const branchPlaced = snapshot.root.includes(BRANCH_ID);
    const loopState = snapshot.sockets[LOOP_ID] || { body: [] };
    const branchState = snapshot.sockets[BRANCH_ID] || { ifTrue: [], otherwise: [] };

    if (!loopPlaced || snapshot.root[0] !== LOOP_ID) {
      return "The long straight section should probably be your loop, and it belongs near the start.";
    }

    if (loopState.header !== "repeat-4" || JSON.stringify(loopState.body) !== JSON.stringify(["forward-loop"])) {
      return attempts > 0
        ? "Put the repeated straight move inside the loop, then check which repeat count fits the beach path."
        : "The repeated straight section should sit inside the loop block.";
    }

    if (!branchPlaced || !snapshot.root.includes(BRANCH_ID)) {
      return "After the long straight section, the fork needs the choice block.";
    }

    if (branchState.header !== "branch-right") {
      return "At the fork, think about whether the correct path is on the left or on the right.";
    }

    if (JSON.stringify(branchState.ifTrue) !== JSON.stringify(["turn-right"])) {
      return "If the right-hand path exists, the explorer should turn before moving on.";
    }

    if (snapshot.root[2] !== "forward-after-branch" || snapshot.root[3] !== "turn-left" || snapshot.root[4] !== "forward-finish") {
      return attempts > 1
        ? "Check the order around the fork: turn, move, turn, move."
        : "Check the order of the steps after the fork.";
    }

    return "You are close. Check the loop count, the fork condition and the turn order around the finish.";
  }

  function validate(snapshot) {
    const loopState = snapshot.sockets[LOOP_ID];
    const branchState = snapshot.sockets[BRANCH_ID];

    return (
      JSON.stringify(snapshot.root) === JSON.stringify([LOOP_ID, BRANCH_ID, "forward-after-branch", "turn-left", "forward-finish"]) &&
      Boolean(loopState) &&
      Boolean(branchState) &&
      loopState.header === "repeat-4" &&
      JSON.stringify(loopState.body) === JSON.stringify(["forward-loop"]) &&
      branchState.header === "branch-right" &&
      JSON.stringify(branchState.ifTrue) === JSON.stringify(["turn-right"]) &&
      JSON.stringify(branchState.otherwise) === JSON.stringify([])
    );
  }

  function simulate(snapshot, maze, adjacency) {
    const position = clonePosition(maze.start);
    const frames = [];
    let failure = null;
    let stepCount = 0;

    function pushFrame(action, state = "idle") {
      frames.push({ position: clonePosition(position), action, state });
    }

    function fail(message, state = "stuck") {
      failure = { message, state };
    }

    function runSequence(pieceIds) {
      for (const pieceId of pieceIds) {
        if (failure) {
          return;
        }

        if (stepCount > 18) {
          fail("That route keeps going for too long. Try simplifying the program.");
          return;
        }

        runPiece(pieceId);
      }
    }

    function runPiece(pieceId) {
      const loopState = snapshot.sockets[LOOP_ID];
      const branchState = snapshot.sockets[BRANCH_ID];

      if (pieceId === LOOP_ID) {
        if (!loopState?.header) {
          fail("The loop needs a condition before the explorer can repeat those steps.");
          return;
        }

        const repeatCount = loopState.header === "repeat-4" ? 4 : loopState.header === "repeat-3" ? 3 : 0;
        if (!repeatCount) {
          fail("That loop condition does not match this trail.");
          return;
        }

        for (let index = 0; index < repeatCount; index += 1) {
          runSequence(loopState.body || []);
          if (failure) {
            return;
          }
        }
        return;
      }

      if (pieceId === BRANCH_ID) {
        if (!branchState?.header) {
          fail("The choice block needs a condition so the explorer knows what to check at the fork.");
          return;
        }

        const condition = branchState.header === "branch-right"
          ? hasEdge(adjacency, position, getTargetCell(position, "right"))
          : hasEdge(adjacency, position, getTargetCell(position, "left"));

        runSequence(condition ? branchState.ifTrue || [] : branchState.otherwise || []);
        return;
      }

      if (pieceId === "turn-right" || pieceId === "turn-left") {
        position.direction = rotateDirection(position.direction, pieceId === "turn-right" ? "right" : "left");
        stepCount += 1;
        pushFrame(pieceId);
        return;
      }

      if (["forward-loop", "forward-after-branch", "forward-finish"].includes(pieceId)) {
        const target = getTargetCell(position, "forward");
        if (!hasEdge(adjacency, position, target)) {
          fail("The explorer walked into a dead end instead of following the trail.");
          return;
        }

        position.x = target.x;
        position.y = target.y;
        stepCount += 1;
        pushFrame(pieceId);
        return;
      }
    }

    runSequence(snapshot.root);

    if (!failure && !isAtFinish(maze, position)) {
      fail("The explorer stopped before the finish gate.", "idle");
    }

    return {
      frames,
      endedAtFinish: isAtFinish(maze, position),
      failure,
      finalPosition: clonePosition(position),
    };
  }

  async function playFrames(explorer, maze, frames, finalState) {
    for (const frame of frames) {
      placeExplorer(explorer, maze, frame.position);
      await wait(frame.action.startsWith("turn") ? ANIMATION_MS.turn : ANIMATION_MS.move);
      await wait(ANIMATION_MS.pause);
    }

    if (frames.length === 0) {
      await wait(ANIMATION_MS.pause);
    }

    placeExplorer(explorer, maze, finalState.position, finalState.state);
  }

  async function replayDemo(explorer) {
    const position = clonePosition(DEMO_MAZE.start);
    placeExplorer(explorer, DEMO_MAZE, position);
    await wait(180);

    for (const action of DEMO_COMMANDS) {
      if (action === "turn-right") {
        position.direction = rotateDirection(position.direction, "right");
        placeExplorer(explorer, DEMO_MAZE, position);
        await wait(ANIMATION_MS.turn);
      } else {
        const target = getTargetCell(position, "forward");
        position.x = target.x;
        position.y = target.y;
        placeExplorer(explorer, DEMO_MAZE, position);
        await wait(ANIMATION_MS.move);
      }

      await wait(ANIMATION_MS.pause);
    }

    placeExplorer(explorer, DEMO_MAZE, position, "finished");
  }

  function initAlgorithmMaze() {
    const page = document.querySelector("[data-algorithm-maze-page]");
    if (!page || !window.summerFairAssembly || !window.summerFairApp) {
      return;
    }

    const activity = window.summerFairApp.getActivityById(ACTIVITY_ID);
    const puzzleBoard = page.querySelector("[data-puzzle-board]");
    const demoBoard = page.querySelector("[data-demo-board]");
    const resultsRegion = page.querySelector("[data-maze-results]");
    const feedback = page.querySelector("[data-maze-feedback]");
    const hint = page.querySelector("[data-maze-hint]");
    const successPanel = page.querySelector("[data-maze-success]");
    const stateTag = page.querySelector("[data-maze-state]");
    const overviewToggle = page.querySelector("[data-overview-toggle]");
    const runButton = page.querySelector("[data-run-program]");
    const checkButton = page.querySelector("[data-check-solution]");
    const resetButton = page.querySelector("[data-reset-program]");
    const hintButton = page.querySelector("[data-show-hint]");
    const demoReplay = page.querySelector("[data-demo-replay]");
    const successReplay = page.querySelector("[data-success-replay]");
    const keyPartMounts = page.querySelectorAll("[data-maze-key-part], [data-maze-key-part-repeat]");
    const compactOverviewQuery = window.matchMedia("(max-width: 63.99rem)");
    const adjacency = buildAdjacency(PUZZLE_MAZE);

    const puzzleExplorer = renderMazeBoard(puzzleBoard, PUZZLE_MAZE);
    const demoExplorer = renderMazeBoard(demoBoard, DEMO_MAZE);

    let failedAttempts = 0;
    let hasSolvedThisAttempt = false;
    let isRunning = false;
    let overviewEnabled = compactOverviewQuery.matches;

    keyPartMounts.forEach((node) => {
      node.textContent = activity.keyPart;
    });

    const engine = new window.summerFairAssembly.BlockAssemblyEngine({
      paletteMount: page.querySelector("[data-assembly-palette]"),
      workspaceMount: page.querySelector("[data-assembly-workspace]"),
      pieces: createPieces(),
      onChange(event) {
        if (event.type === "place" && hasSolvedThisAttempt) {
          hasSolvedThisAttempt = false;
          successPanel.hidden = true;
          successPanel.classList.remove("is-celebrating");
          stateTag.textContent = "Rebuilding";
          window.summerFairApp.setCompleted(ACTIVITY_ID, false);
          window.summerFairApp.refreshPageChrome();
        }
      },
    });

    function setBusy(isBusy) {
      isRunning = isBusy;
      [runButton, checkButton, resetButton, hintButton, demoReplay, successReplay, overviewToggle].forEach((button) => {
        if (button) {
          button.disabled = isBusy || (button === overviewToggle && !compactOverviewQuery.matches);
        }
      });
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

    function resetPuzzleExplorer() {
      placeExplorer(puzzleExplorer, PUZZLE_MAZE, PUZZLE_MAZE.start);
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
      overviewToggle.disabled = isRunning || !compactOverviewQuery.matches;
      overviewToggle.setAttribute("aria-pressed", String(enabled));
      overviewToggle.textContent = compactOverviewQuery.matches ? (enabled ? "Overview: on" : "Overview: off") : "Overview unavailable";
    }

    function applyBaseState() {
      failedAttempts = 0;
      hasSolvedThisAttempt = false;
      successPanel.hidden = true;
      successPanel.classList.remove("is-celebrating");
      setFeedback("Build the route, then run the program to see where the explorer goes.", null);
      setHint("Hints will help with the loop, the fork choice and the turn order.");
      stateTag.textContent = window.summerFairApp.getProgress().completed[ACTIVITY_ID]
        ? "Completed earlier"
        : "Ready to map the route";
      resetPuzzleExplorer();
    }

    async function runSnapshot(snapshot, checkMode) {
      const result = simulate(snapshot, PUZZLE_MAZE, adjacency);
      resetPuzzleExplorer();
      setBusy(true);
      await playFrames(puzzleExplorer, PUZZLE_MAZE, result.frames, {
        position: result.finalPosition,
        state: result.failure ? result.failure.state : "finished",
      });
      setBusy(false);
      renderOverviewToggle();

      const solved = !result.failure && result.endedAtFinish && validate(snapshot);

      if (!checkMode) {
        if (solved) {
          setFeedback("The explorer reached the finish. This route works.", "success");
          stateTag.textContent = "Route runs";
        } else {
          setFeedback(result.failure?.message || "The explorer reached the end of the program without solving the maze.", "error");
          stateTag.textContent = "Route tested";
        }

        return solved;
      }

      if (solved) {
        hasSolvedThisAttempt = true;
        playCelebration();
        setFeedback("Correct. Your program guides the explorer all the way to the finish.", "success");
        setHint("Great. The loop handled the long path and the choice block handled the fork.");
        stateTag.textContent = "Completed";
        window.summerFairApp.setCompleted(ACTIVITY_ID, true);
        window.summerFairApp.refreshPageChrome();
        window.summerFairApp.scrollToFeedback(resultsRegion || feedback);
        return true;
      }

      failedAttempts += 1;
      setFeedback(
        result.failure?.message || "The explorer moved, but the final program shape is still not the expected one.",
        "error"
      );
      setHint(getHint(snapshot, failedAttempts));
      stateTag.textContent = "Try again";
      window.summerFairApp.scrollToFeedback(resultsRegion || feedback);
      return false;
    }

    applyBaseState();
    renderOverviewToggle();
    replayDemo(demoExplorer);

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
      if (!compactOverviewQuery.matches || isRunning) {
        return;
      }

      overviewEnabled = !overviewEnabled;
      renderOverviewToggle();
    });

    demoReplay?.addEventListener("click", async () => {
      if (isRunning) {
        return;
      }

      setBusy(true);
      await replayDemo(demoExplorer);
      setBusy(false);
      renderOverviewToggle();
    });

    runButton.addEventListener("click", async () => {
      if (isRunning) {
        return;
      }

      await runSnapshot(engine.getSnapshot(), false);
    });

    checkButton.addEventListener("click", async () => {
      if (isRunning) {
        return;
      }

      await runSnapshot(engine.getSnapshot(), true);
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

      setHint(getHint(engine.getSnapshot(), failedAttempts));
    });

    successReplay?.addEventListener("click", async () => {
      if (isRunning) {
        return;
      }

      playCelebration();
      await runSnapshot(engine.getSnapshot(), false);
    });
  }

  document.addEventListener("DOMContentLoaded", initAlgorithmMaze);
})();