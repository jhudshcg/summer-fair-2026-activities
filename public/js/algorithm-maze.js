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
  const LOOP_IDS = ["repeat-loop-1", "repeat-loop-2", "repeat-loop-3"];
  const BRANCH_IDS = ["branch-check-1", "branch-check-2"];
  const COUNT_CONDITION_IDS = ["repeat-times-1", "repeat-times-2"];
  const COUNT_VALUE_BY_CONDITION = {
    "repeat-times-1": "repeat-count-value-1",
    "repeat-times-2": "repeat-count-value-2",
  };
  const UNTIL_CONDITION_ID = "repeat-until-finish";
  const BRANCH_LEFT_CONDITION_ID = "branch-left";
  const BRANCH_RIGHT_CONDITION_ID = "branch-right";
  const STATEMENT_ROLES = {
    "forward-1": "forward",
    "forward-2": "forward",
    "forward-3": "forward",
    "forward-4": "forward",
    "turn-left-1": "left",
    "turn-left-2": "left",
    "turn-left-3": "left",
    "turn-right-1": "right",
    "turn-right-2": "right",
  };
  const DEFAULT_MAZE_FRAME_ASPECT_RATIO = 1.24;
  const STEP_LIMIT = 28;
  const SHORTEST_SOLUTION_MAX_PIECES = 9;
  const ANIMATION_MS = {
    move: 520,
    turn: 320,
    pause: 140,
  };
  const RUN_FOCUS_SCROLL_DELAY = 180;
  const RUN_FOCUS_RESTORE_DELAY = 4000;
  const RUN_FOCUS_VIEWPORT_MARGIN = 28;
  const RUN_FOCUS_MAX_SCALE = 0.55;
  const RUN_FOCUS_MIN_SCALE = 0.24;
  const RUN_FOCUS_MAX_WIDTH_RATIO = 0.39;
  const RUN_FOCUS_MAX_WIDTH_PX = 276;
  const RUN_FOCUS_MIN_WIDTH_PX = 118;

  const DEMO_MAZE = {
    cols: 4,
    rows: 4,
    cellSize: 64,
    padding: 28,
    frameAspectRatio: 1.16,
    start: { x: 1, y: 1, direction: "east" },
    finish: { x: 2, y: 2 },
    edges: [
      [{ x: 1, y: 1 }, { x: 2, y: 1 }],
      [{ x: 2, y: 1 }, { x: 2, y: 2 }],
    ],
  };
  const PUZZLE_MAZE = {
    cols: 5,
    rows: 7,
    cellSize: 52,
    padding: 30,
    frameAspectRatio: 0.88,
    start: { x: 0, y: 6, direction: "east" },
    finish: { x: 1, y: 0 },
    edges: [
      [{ x: 0, y: 6 }, { x: 1, y: 6 }],
      [{ x: 1, y: 6 }, { x: 1, y: 4 }],
      [{ x: 1, y: 4 }, { x: 0, y: 4 }],
      [{ x: 0, y: 4 }, { x: 0, y: 3 }],
      [{ x: 0, y: 3 }, { x: 3, y: 3 }],
      [{ x: 3, y: 3 }, { x: 3, y: 0 }],
      [{ x: 3, y: 0 }, { x: 1, y: 0 }],
      [{ x: 3, y: 3 }, { x: 4, y: 3 }],
      [{ x: 4, y: 3 }, { x: 4, y: 4 }],
      [{ x: 4, y: 4 }, { x: 3, y: 4 }],
      [{ x: 3, y: 4 }, { x: 3, y: 3 }],
      [{ x: 3, y: 0 }, { x: 4, y: 0 }],
      [{ x: 4, y: 0 }, { x: 4, y: 1 }],
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

  function isLoopContainer(pieceId) {
    return LOOP_IDS.includes(pieceId);
  }

  function isBranchContainer(pieceId) {
    return BRANCH_IDS.includes(pieceId);
  }

  function isCountCondition(pieceId) {
    return COUNT_CONDITION_IDS.includes(pieceId);
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
      const deltaX = Math.sign(to.x - from.x);
      const deltaY = Math.sign(to.y - from.y);
      const distance = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
      let current = { x: from.x, y: from.y };

      for (let step = 0; step < distance; step += 1) {
        const next = {
          x: current.x + deltaX,
          y: current.y + deltaY,
        };
        add(current, next);
        add(next, current);
        current = next;
      }
    });

    return adjacency;
  }

  function getMazeMetrics(maze) {
    return {
      width: maze.padding * 2 + maze.cellSize * (maze.cols - 1),
      height: maze.padding * 2 + maze.cellSize * (maze.rows - 1),
    };
  }

  function getMazeContentBounds(maze) {
    const TRAIL_RADIUS = 12;
    const START_BADGE = { width: 56, height: 20, offsetX: 28, top: 34 };
    const FINISH_BADGE = { width: 60, height: 20, offsetX: 30, top: -12 };
    const EXPLORER_RADIUS = 14;
    const OUTER_PADDING = 16;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const includeRect = (x, y, width, height) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    };

    const includePoint = (x, y, radius = 0) => {
      includeRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    maze.edges.forEach(([from, to]) => {
      const start = toPixel(maze, from.x, from.y);
      const end = toPixel(maze, to.x, to.y);
      includeRect(
        Math.min(start.x, end.x) - TRAIL_RADIUS,
        Math.min(start.y, end.y) - TRAIL_RADIUS,
        Math.abs(end.x - start.x) + TRAIL_RADIUS * 2,
        Math.abs(end.y - start.y) + TRAIL_RADIUS * 2
      );
    });

    const nodes = new Map();
    maze.edges.flat().forEach((cell) => {
      nodes.set(cellKey(cell), cell);
    });
    nodes.set(cellKey(maze.start), maze.start);
    nodes.set(cellKey(maze.finish), maze.finish);

    nodes.forEach((cell) => {
      const pixel = toPixel(maze, cell.x, cell.y);
      includePoint(pixel.x, pixel.y, TRAIL_RADIUS);
    });

    const startPixel = toPixel(maze, maze.start.x, maze.start.y);
    includeRect(
      startPixel.x - START_BADGE.offsetX,
      startPixel.y - START_BADGE.top,
      START_BADGE.width,
      START_BADGE.height
    );

    const finishPixel = toPixel(maze, maze.finish.x, maze.finish.y);
    includeRect(
      finishPixel.x - FINISH_BADGE.offsetX,
      finishPixel.y - FINISH_BADGE.top,
      FINISH_BADGE.width,
      FINISH_BADGE.height
    );

    includePoint(startPixel.x, startPixel.y, EXPLORER_RADIUS);
    includePoint(finishPixel.x, finishPixel.y, EXPLORER_RADIUS);

    return {
      originX: minX - OUTER_PADDING,
      originY: minY - OUTER_PADDING,
      width: maxX - minX + OUTER_PADDING * 2,
      height: maxY - minY + OUTER_PADDING * 2,
    };
  }

  function toPixel(maze, x, y) {
    return {
      x: maze.padding + x * maze.cellSize,
      y: maze.padding + y * maze.cellSize,
    };
  }

  function toPercent(maze, position, renderMetrics = null) {
    const metrics = renderMetrics || {
      originX: 0,
      originY: 0,
      ...getMazeMetrics(maze),
    };
    const pixel = toPixel(maze, position.x, position.y);
    return {
      left: `${((pixel.x - metrics.originX) / metrics.width) * 100}%`,
      top: `${((pixel.y - metrics.originY) / metrics.height) * 100}%`,
    };
  }

  function getRotation(direction) {
    return `${DIRECTION_ORDER.indexOf(direction) * 90}deg`;
  }

  function getExplorerOffset(direction) {
    switch (direction) {
      case "east":
        return { x: "1.5px", y: "0px" };
      case "south":
        return { x: "0px", y: "-1.5px" };
      case "west":
        return { x: "-1.5px", y: "0px" };
      case "north":
        return { x: "0px", y: "1.5px" };
      default:
        return { x: "0px", y: "0px" };
    }
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

  function createLoopPiece(pieceId, vocabulary) {
    const { families, kickers, socketLabels, emptyLabels } = vocabulary;

    return {
      id: pieceId,
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
    };
  }

  function createCountCondition(pieceId, valueFamily, vocabulary) {
    const { families, kickers, labels, socketLabels, emptyLabels } = vocabulary;

    return {
      id: pieceId,
      kind: "condition",
      family: families.repeat,
      kicker: kickers.condition,
      label: labels.repeatCount,
      sockets: [
        {
          key: "value",
          mode: "single",
          label: socketLabels.number,
          emptyLabel: emptyLabels.number,
          acceptKinds: ["value"],
          acceptFamilies: [valueFamily],
        },
      ],
    };
  }

  function createValuePiece(pieceId, family, vocabulary) {
    const { kickers } = vocabulary;

    return {
      id: pieceId,
      kind: "value",
      family,
      kicker: kickers.number,
      label: "",
      input: {
        type: "number",
        inputMode: "numeric",
        min: "1",
        max: "4",
        step: "1",
        placeholder: "1",
        defaultValue: "",
        maxLength: 6,
        ariaLabel: "Repeat count",
      },
    };
  }

  function createBranchPiece(pieceId, vocabulary) {
    const { families, kickers, labels, socketLabels, emptyLabels } = vocabulary;

    return {
      id: pieceId,
      kind: "container",
      kicker: kickers.choice,
      label: labels.choice,
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
        {
          key: "otherwise",
          mode: "sequence",
          label: socketLabels.choiceOtherwise,
          emptyLabel: emptyLabels.optionalPath,
          acceptKinds: ["statement", "container"],
        },
      ],
    };
  }

  function createPieces(vocabulary) {
    const { families, kickers, labels } = vocabulary;

    return [
      createLoopPiece(LOOP_IDS[0], vocabulary),
      createLoopPiece(LOOP_IDS[1], vocabulary),
      createLoopPiece(LOOP_IDS[2], vocabulary),
      createCountCondition(COUNT_CONDITION_IDS[0], "repeat-value-1", vocabulary),
      createCountCondition(COUNT_CONDITION_IDS[1], "repeat-value-2", vocabulary),
      {
        id: UNTIL_CONDITION_ID,
        kind: "condition",
        family: families.repeat,
        kicker: kickers.condition,
        label: labels.untilFinish,
      },
      createValuePiece("repeat-count-value-1", "repeat-value-1", vocabulary),
      createValuePiece("repeat-count-value-2", "repeat-value-2", vocabulary),
      createBranchPiece(BRANCH_IDS[0], vocabulary),
      createBranchPiece(BRANCH_IDS[1], vocabulary),
      {
        id: BRANCH_LEFT_CONDITION_ID,
        kind: "condition",
        family: families.choice,
        kicker: kickers.condition,
        label: "there is a path to the left",
      },
      {
        id: BRANCH_RIGHT_CONDITION_ID,
        kind: "condition",
        family: families.choice,
        kicker: kickers.condition,
        label: "there is a path to the right",
      },
      {
        id: "forward-1",
        kind: "statement",
        kicker: kickers.step,
        label: "move forward",
      },
      {
        id: "forward-2",
        kind: "statement",
        kicker: kickers.step,
        label: "move forward",
      },
      {
        id: "forward-3",
        kind: "statement",
        kicker: kickers.step,
        label: "move forward",
      },
      {
        id: "forward-4",
        kind: "statement",
        kicker: kickers.step,
        label: "move forward",
      },
      {
        id: "turn-left-1",
        kind: "statement",
        kicker: kickers.step,
        label: "turn left",
      },
      {
        id: "turn-left-2",
        kind: "statement",
        kicker: kickers.step,
        label: "turn left",
      },
      {
        id: "turn-left-3",
        kind: "statement",
        kicker: kickers.step,
        label: "turn left",
      },
      {
        id: "turn-right-1",
        kind: "statement",
        kicker: kickers.step,
        label: "turn right",
      },
      {
        id: "turn-right-2",
        kind: "statement",
        kicker: kickers.step,
        label: "turn right",
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

  function renderMazeBoard(mount, maze, options = {}) {
    mount.innerHTML = "";
    const frame = document.createElement("div");
    frame.className = `maze-board__frame${options.className ? ` ${options.className}` : ""}`;
    frame.style.setProperty(
      "--maze-frame-ratio",
      String(options.frameAspectRatio || maze.frameAspectRatio || DEFAULT_MAZE_FRAME_ASPECT_RATIO)
    );

    const scene = document.createElement("div");
    scene.className = "maze-board__scene";

    const background = document.createElement("div");
    background.className = "maze-board__background";

    const metrics = getMazeMetrics(maze);
    const viewport = document.createElement("div");
    viewport.className = "maze-board__viewport";

    const svg = createSvgElement("svg", {
      class: "maze-board__svg",
      viewBox: `0 0 ${metrics.width} ${metrics.height}`,
      role: "img",
      "aria-hidden": "true",
    });
    const content = createSvgElement("g");
    svg.append(content);

    [
      { cx: metrics.width * 0.12, cy: metrics.height * 0.14, r: 18 },
      { cx: metrics.width * 0.86, cy: metrics.height * 0.22, r: 14 },
      { cx: metrics.width * 0.78, cy: metrics.height * 0.82, r: 20 },
      { cx: metrics.width * 0.24, cy: metrics.height * 0.76, r: 12 },
    ].forEach((dot) => {
      const dotElement = document.createElement("span");
      dotElement.className = "maze-water-dot";
      dotElement.style.left = `${(dot.cx / metrics.width) * 100}%`;
      dotElement.style.top = `${(dot.cy / metrics.height) * 100}%`;
      dotElement.style.width = `${dot.r * 2}px`;
      dotElement.style.height = `${dot.r * 2}px`;
      background.append(dotElement);
    });

    maze.edges.forEach(([from, to]) => {
      const start = toPixel(maze, from.x, from.y);
      const end = toPixel(maze, to.x, to.y);
      content.append(createSvgElement("line", { class: "maze-trail-base", x1: start.x, y1: start.y, x2: end.x, y2: end.y }));
      content.append(createSvgElement("line", { class: "maze-trail-top", x1: start.x, y1: start.y, x2: end.x, y2: end.y }));
    });

    const nodes = new Map();
    maze.edges.flat().forEach((cell) => {
      nodes.set(cellKey(cell), cell);
    });
    nodes.set(cellKey(maze.start), maze.start);
    nodes.set(cellKey(maze.finish), maze.finish);

    nodes.forEach((cell) => {
      const pixel = toPixel(maze, cell.x, cell.y);
      content.append(createSvgElement("circle", { class: "maze-trail-node", cx: pixel.x, cy: pixel.y, r: 10 }));
    });

    const startPixel = toPixel(maze, maze.start.x, maze.start.y);
    content.append(createSvgElement("rect", { class: "maze-start-badge", x: startPixel.x - 28, y: startPixel.y - 34, rx: 10, ry: 10, width: 56, height: 20 }));
    const startLabel = createSvgElement("text", { class: "maze-label", x: startPixel.x, y: startPixel.y - 20, "text-anchor": "middle" });
    startLabel.textContent = "Start";
    content.append(startLabel);

    const finishPixel = toPixel(maze, maze.finish.x, maze.finish.y);
    content.append(createSvgElement("rect", { class: "maze-finish-badge", x: finishPixel.x - 30, y: finishPixel.y + 12, rx: 10, ry: 10, width: 60, height: 20 }));
    const finishLabel = createSvgElement("text", { class: "maze-label maze-finish-label", x: finishPixel.x, y: finishPixel.y + 27, "text-anchor": "middle" });
    finishLabel.textContent = "Finish";
    content.append(finishLabel);

    const explorer = document.createElement("div");
    explorer.className = "maze-explorer";
    explorer.setAttribute("aria-hidden", "true");

    viewport.append(svg, explorer);
    scene.append(background, viewport);
    frame.append(scene);
    mount.append(frame);

    const renderMetrics = getMazeContentBounds(maze);
    const contentAspectRatio = renderMetrics.width / renderMetrics.height;
    const frameAspectRatio = options.frameAspectRatio || maze.frameAspectRatio || DEFAULT_MAZE_FRAME_ASPECT_RATIO;

    svg.setAttribute("viewBox", `${renderMetrics.originX} ${renderMetrics.originY} ${renderMetrics.width} ${renderMetrics.height}`);
    viewport.style.aspectRatio = `${renderMetrics.width} / ${renderMetrics.height}`;
    if (contentAspectRatio <= frameAspectRatio) {
      viewport.style.height = "100%";
      viewport.style.width = `${(contentAspectRatio / frameAspectRatio) * 100}%`;
    } else {
      viewport.style.width = "100%";
      viewport.style.height = `${(frameAspectRatio / contentAspectRatio) * 100}%`;
    }
    explorer._renderMetrics = renderMetrics;

    return explorer;
  }

  function placeExplorer(explorer, maze, position, state = "idle") {
    const coords = toPercent(maze, position, explorer._renderMetrics || null);
    const offset = getExplorerOffset(position.direction);
    explorer.style.setProperty("--maze-x", coords.left);
    explorer.style.setProperty("--maze-y", coords.top);
    explorer.style.setProperty("--maze-rotation", getRotation(position.direction));
    explorer.style.setProperty("--maze-offset-x", offset.x);
    explorer.style.setProperty("--maze-offset-y", offset.y);
    explorer.classList.toggle("is-stuck", state === "stuck");
    explorer.classList.toggle("is-finished", state === "finished");
  }

  function getRepeatCount(snapshot, conditionId) {
    const valuePieceId = COUNT_VALUE_BY_CONDITION[conditionId];
    if (!valuePieceId) {
      return null;
    }

    const valueSocket = snapshot.sockets[conditionId] || {};
    if (valueSocket.value !== valuePieceId) {
      return null;
    }

    const rawValue = snapshot.values?.[valuePieceId] ?? "";
    const count = Number.parseInt(String(rawValue), 10);
    return Number.isInteger(count) ? count : null;
  }

  function getPlacedPieceIds(snapshot) {
    const visited = new Set();

    const visit = (pieceId) => {
      if (!pieceId || visited.has(pieceId)) {
        return;
      }

      visited.add(pieceId);
      const socketState = snapshot.sockets[pieceId];
      if (!socketState) {
        return;
      }

      Object.values(socketState).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach(visit);
        } else {
          visit(value);
        }
      });
    };

    snapshot.root.forEach(visit);
    return visited;
  }

  function countPlacedPieces(snapshot) {
    return getPlacedPieceIds(snapshot).size;
  }

  function hasAnyCountedLoop(snapshot) {
    return LOOP_IDS.some((loopId) => {
      const header = (snapshot.sockets[loopId] || {}).header;
      return isCountCondition(header);
    });
  }

  function hasUntilLoop(snapshot) {
    return LOOP_IDS.some((loopId) => (snapshot.sockets[loopId] || {}).header === UNTIL_CONDITION_ID);
  }

  function missingCountValue(snapshot) {
    return COUNT_CONDITION_IDS.some((conditionId) => {
      const isPlaced = getPlacedPieceIds(snapshot).has(conditionId);
      return isPlaced && getRepeatCount(snapshot, conditionId) === null;
    });
  }

  function matchesShortestShape(snapshot) {
    if (snapshot.root.length !== 1 || !isLoopContainer(snapshot.root[0])) {
      return false;
    }

    const outerLoopId = snapshot.root[0];
    const outerLoop = snapshot.sockets[outerLoopId] || {};
    if (outerLoop.header !== UNTIL_CONDITION_ID || !Array.isArray(outerLoop.body) || outerLoop.body.length !== 2) {
      return false;
    }

    const [firstPiece, branchOneId] = outerLoop.body;
    if (STATEMENT_ROLES[firstPiece] !== "forward" || !isBranchContainer(branchOneId)) {
      return false;
    }

    const branchOne = snapshot.sockets[branchOneId] || {};
    if (branchOne.header !== BRANCH_LEFT_CONDITION_ID) {
      return false;
    }

    if (!Array.isArray(branchOne.ifTrue) || branchOne.ifTrue.length !== 1 || STATEMENT_ROLES[branchOne.ifTrue[0]] !== "left") {
      return false;
    }

    if (!Array.isArray(branchOne.otherwise) || branchOne.otherwise.length !== 1 || !isBranchContainer(branchOne.otherwise[0])) {
      return false;
    }

    const branchTwo = snapshot.sockets[branchOne.otherwise[0]] || {};
    return (
      branchTwo.header === BRANCH_RIGHT_CONDITION_ID &&
      Array.isArray(branchTwo.ifTrue) &&
      branchTwo.ifTrue.length === 1 &&
      STATEMENT_ROLES[branchTwo.ifTrue[0]] === "right"
    );
  }

  function analyzeSolution(snapshot, result) {
    const placedCount = countPlacedPieces(snapshot);
    const works = !result.failure && result.endedAtFinish;

    if (!works) {
      return {
        works: false,
        placedCount,
        isShortest: false,
        usedCountedLoops: hasAnyCountedLoop(snapshot),
      };
    }

    const isShortest = matchesShortestShape(snapshot) || placedCount <= SHORTEST_SOLUTION_MAX_PIECES;
    return {
      works: true,
      placedCount,
      isShortest,
      usedCountedLoops: hasAnyCountedLoop(snapshot),
    };
  }

  function resetExplorerImmediately(explorer, maze, position, state = "idle") {
    explorer.classList.add("is-resetting");
    placeExplorer(explorer, maze, position, state);
    void explorer.offsetWidth;
    explorer.classList.remove("is-resetting");
  }

  function setActiveDemoCommand(commandElements, index = -1) {
    commandElements.forEach((element, elementIndex) => {
      element.classList.toggle("is-active", elementIndex === index);
    });
  }

  function getHint(snapshot, attempts = 0) {
    const placedCount = countPlacedPieces(snapshot);

    if (placedCount === 0) {
      return "Look for repeated movement patterns. You can solve this maze with counted loops, or try one repeat-until-finish loop with turn checks.";
    }

    if (missingCountValue(snapshot)) {
      return "If you use a counted loop, the number matters. Think about how many times that forward-and-turn pattern repeats.";
    }

    if (!hasUntilLoop(snapshot) && attempts > 0) {
      return "One working strategy uses counted loops first, then a repeat-until-finish loop for the last part of the route.";
    }

    if (attempts > 1) {
      return "There is more than one working solution here. After you find one, see if you can shorten it by reacting to left and right paths.";
    }

    return "Check where the explorer needs to turn left, where it needs to turn right, and whether a repeat-until-finish loop could simplify the code.";
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

    function guardSteps() {
      if (stepCount > STEP_LIMIT) {
        fail("That program keeps going for too long. Try a shorter or more direct idea.");
        return true;
      }

      return false;
    }

    function runSequence(pieceIds) {
      for (const pieceId of pieceIds) {
        if (failure) {
          return;
        }

        runPiece(pieceId);
      }
    }

    function runLoop(pieceId) {
      const loopState = snapshot.sockets[pieceId];
      if (!loopState?.header) {
        fail("That loop needs a condition before the explorer can use it.");
        return;
      }

      if (isCountCondition(loopState.header)) {
        const repeatCount = getRepeatCount(snapshot, loopState.header);
        if (!repeatCount) {
          fail("A counted loop needs a number before the explorer knows how many repeats to use.");
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

      if (loopState.header === UNTIL_CONDITION_ID) {
        let guard = 0;
        while (!isAtFinish(maze, position)) {
          guard += 1;
          if (guard > STEP_LIMIT) {
            fail("That repeat-until-finish idea kept going for too long. Check the turns inside it.");
            return;
          }

          runSequence(loopState.body || []);
          if (failure) {
            return;
          }
        }
        return;
      }

      fail("That loop condition does not fit this maze.");
    }

    function runBranch(pieceId) {
      const branchState = snapshot.sockets[pieceId];
      if (!branchState?.header) {
        fail("That choice block needs a condition before the explorer can decide which way to turn.");
        return;
      }

      let condition = false;
      if (branchState.header === BRANCH_RIGHT_CONDITION_ID) {
        condition = hasEdge(adjacency, position, getTargetCell(position, "right"));
      } else if (branchState.header === BRANCH_LEFT_CONDITION_ID) {
        condition = hasEdge(adjacency, position, getTargetCell(position, "left"));
      } else {
        fail("That choice condition does not fit this maze.");
        return;
      }

      runSequence(condition ? branchState.ifTrue || [] : branchState.otherwise || []);
    }

    function runPiece(pieceId) {
      if (isLoopContainer(pieceId)) {
        runLoop(pieceId);
        return;
      }

      if (isBranchContainer(pieceId)) {
        runBranch(pieceId);
        return;
      }

      const statementRole = STATEMENT_ROLES[pieceId];
      if (statementRole === "left" || statementRole === "right") {
        position.direction = rotateDirection(position.direction, statementRole === "right" ? "right" : "left");
        stepCount += 1;
        pushFrame(pieceId);
        guardSteps();
        return;
      }

      if (statementRole === "forward") {
        const target = getTargetCell(position, "forward");
        if (!hasEdge(adjacency, position, target)) {
          fail("The explorer walked into a dead end instead of following the trail.");
          return;
        }

        position.x = target.x;
        position.y = target.y;
        stepCount += 1;
        pushFrame(pieceId);
        guardSteps();
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

  async function playFrames(explorer, maze, frames, finalState, hooks = {}) {
    for (const frame of frames) {
      hooks.onFrameStart?.(frame);
      placeExplorer(explorer, maze, frame.position);
      await wait(frame.action.startsWith("turn") ? ANIMATION_MS.turn : ANIMATION_MS.move);
      await wait(ANIMATION_MS.pause);
    }

    if (frames.length === 0) {
      await wait(ANIMATION_MS.pause);
    }

    hooks.onFrameStart?.(null);
    placeExplorer(explorer, maze, finalState.position, finalState.state);
  }

  async function replayDemo(explorer, commandElements) {
    const position = clonePosition(DEMO_MAZE.start);
    resetExplorerImmediately(explorer, DEMO_MAZE, position);
    setActiveDemoCommand(commandElements, -1);
    await wait(220);

    for (const [index, action] of DEMO_COMMANDS.entries()) {
      setActiveDemoCommand(commandElements, index);
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

    setActiveDemoCommand(commandElements, -1);
    placeExplorer(explorer, DEMO_MAZE, position, "finished");
  }

  function initAlgorithmMaze() {
    const page = document.querySelector("[data-algorithm-maze-page]");
    if (!page || !window.summerFairAssembly || !window.summerFairApp) {
      return;
    }

    window.summerFairApp.initTipsToggle(page);

    const activity = window.summerFairApp.getActivityById(ACTIVITY_ID);
    const savedActivityState = window.summerFairApp.getActivityState(ACTIVITY_ID);
    const puzzleBoard = page.querySelector("[data-puzzle-board]");
    const demoBoard = page.querySelector("[data-demo-board]");
    const summaryCard = page.querySelector("[data-run-focus-host]");
    const testCard = page.querySelector("[data-maze-test]");
    const assemblyLayout = page.querySelector(".assembly-layout");
    const workspaceColumn = page.querySelector("[data-assembly-workspace-column]");
    const runStage = page.querySelector("[data-run-focus-stage]");
    const workspaceDock = page.querySelector("[data-run-focus-workspace-dock]");
    const resultsDock = page.querySelector("[data-run-focus-results-dock]");
    const resultsHome = page.querySelector("[data-run-focus-results-home]");
    const resultsRegion = page.querySelector("[data-maze-results]");
    const feedback = page.querySelector("[data-maze-feedback]");
    const hint = page.querySelector("[data-maze-hint]");
    const successPanel = page.querySelector("[data-maze-success]");
    const stateTag = page.querySelector("[data-maze-state]");
    const overviewToggle = page.querySelector("[data-overview-toggle]");
    const checkButton = page.querySelector("[data-check-solution]");
    const resetButton = page.querySelector("[data-reset-program]");
    const hintButton = page.querySelector("[data-show-hint]");
    const demoReplay = page.querySelector("[data-demo-replay]");
    const successReplay = page.querySelector("[data-success-replay]");
    const demoCommands = Array.from(page.querySelectorAll("[data-demo-command]"));
    const keyPartMounts = page.querySelectorAll("[data-maze-key-part], [data-maze-key-part-repeat]");
    const compactOverviewQuery = window.matchMedia("(width < 1024px)");
    const adjacency = buildAdjacency(PUZZLE_MAZE);

    const puzzleExplorer = renderMazeBoard(puzzleBoard, PUZZLE_MAZE);
    const demoExplorer = renderMazeBoard(demoBoard, DEMO_MAZE);
    const runFocus = window.summerFairApp.createRunFocusController({
      page,
      runStage,
      assemblyLayout,
      workspaceColumn,
      workspaceDock,
      resultsRegion,
      resultsDock,
      resultsHome,
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

    const vocabulary = window.summerFairAssembly.vocabulary;
    const engine = new window.summerFairAssembly.BlockAssemblyEngine({
      paletteMount: page.querySelector("[data-assembly-palette]"),
      workspaceMount: page.querySelector("[data-assembly-workspace]"),
      pieces: createPieces(vocabulary),
      onChange(event) {
        if (event.type === "reject") {
          setFeedback(event.message, "error");
          return;
        }

        if (["place", "value", "reset"].includes(event.type)) {
          clearRunHighlight();
          runFocus.setEnabled(false);
        }

        if (["place", "value", "reset"].includes(event.type) && hasSolvedThisAttempt) {
          hasSolvedThisAttempt = false;
          successPanel.hidden = true;
          successPanel.classList.remove("is-celebrating");
          stateTag.textContent = "Rebuilding";
          window.summerFairApp.setCompleted(ACTIVITY_ID, false);
          window.summerFairApp.refreshPageChrome();
        }

        window.summerFairApp.setActivityState(ACTIVITY_ID, {
          assemblySnapshot: engine.getSnapshot(),
        });
      },
    });

    if (savedActivityState?.assemblySnapshot) {
      engine.restoreSnapshot(savedActivityState.assemblySnapshot);
    }

    if (window.location.hash === "#debug") {
      window.__summerFairMazeDebug = {
        buildEmptyState() {
          return engine.buildEmptyState();
        },
        getSnapshot() {
          return engine.getSnapshot();
        },
        applySnapshot(snapshot) {
          engine.restoreSnapshot(snapshot);
        },
        simulate(snapshot = engine.getSnapshot()) {
          const result = simulate(snapshot, PUZZLE_MAZE, adjacency);
          return {
            result,
            analysis: analyzeSolution(snapshot, result),
          };
        },
        async run(checkMode = true) {
          return runSnapshot(engine.getSnapshot(), checkMode);
        },
      };
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

    function setRunHighlight(pieceId) {
      clearRunHighlight();
      if (!pieceId) {
        return;
      }

      page.querySelectorAll(`[data-piece-id="${pieceId}"]`).forEach((piece) => {
        piece.classList.add("is-running");
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

    function scrollMazeIntoView() {
      const target = puzzleBoard || summaryCard || testCard || resultsRegion || feedback;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - 12);
      window.scrollTo({
        top,
        behavior: "auto",
      });
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
      clearRunHighlight();
      runFocus.setEnabled(false);
      setFeedback("Build the route, then check the solution to see where the explorer goes.", null);
      setHint("Hints can steer you toward a working solution, and then toward a shorter one.");
      stateTag.textContent = window.summerFairApp.getProgress().completed[ACTIVITY_ID]
        ? "Completed earlier"
        : "Ready to map the route";
      resetPuzzleExplorer();
    }

    async function runSnapshot(snapshot, checkMode) {
      const result = simulate(snapshot, PUZZLE_MAZE, adjacency);
      const analysis = analyzeSolution(snapshot, result);
      setBusy(true);
      runFocus.setEnabled(true);
      scrollMazeIntoView();
      await wait(RUN_FOCUS_SCROLL_DELAY);
      resetPuzzleExplorer();
      try {
        await playFrames(puzzleExplorer, PUZZLE_MAZE, result.frames, {
          position: result.finalPosition,
          state: result.failure ? result.failure.state : "finished",
        }, {
          onFrameStart(frame) {
            setRunHighlight(frame?.action || null);
          },
        });

        if (!checkMode) {
          if (analysis.works) {
            setFeedback(
              analysis.isShortest
                ? "The explorer reached the finish with the shortest code route."
                : "The explorer reached the finish. This route works.",
              "success"
            );
            stateTag.textContent = analysis.isShortest ? "Shortest route" : "Route runs";
          } else {
            setFeedback(result.failure?.message || "The explorer reached the end of the program without solving the maze.", "error");
            stateTag.textContent = "Route tested";
          }

          await wait(RUN_FOCUS_RESTORE_DELAY);
          return analysis.works;
        }

        if (analysis.works) {
          hasSolvedThisAttempt = true;
          playCelebration();
          if (analysis.isShortest) {
            setFeedback("Correct. Your program reaches the finish, and it is the shortest code solution.", "success");
            setHint("You found the shortest route. Nice use of repeat-until-finish with left and right checks.");
            stateTag.textContent = "Shortest solution";
          } else {
            setFeedback("Correct. Your program reaches the finish. Now see if you can find a shorter one.", "success");
            setHint("That works. There is also a shorter solution that keeps moving until the finish and reacts to left or right paths.");
            stateTag.textContent = "Completed";
          }

          window.summerFairApp.setCompleted(ACTIVITY_ID, true);
          window.summerFairApp.refreshPageChrome();
          scrollMazeIntoView();
          await wait(RUN_FOCUS_RESTORE_DELAY);
          return true;
        }

        failedAttempts += 1;
        setFeedback(
          result.failure?.message || "That program moved the explorer, but it did not solve the maze.",
          "error"
        );
        setHint(getHint(snapshot, failedAttempts));
        stateTag.textContent = "Try again";
        scrollMazeIntoView();
        await wait(RUN_FOCUS_RESTORE_DELAY);
        return false;
      } finally {
        clearRunHighlight();
        runFocus.setEnabled(false);
        setBusy(false);
        renderOverviewToggle();
      }
    }

    applyBaseState();
    renderOverviewToggle();
    replayDemo(demoExplorer, demoCommands);

    const handleRunFocusViewportChange = () => {
      if (!runFocus.isEnabled()) {
        return;
      }

      runFocus.updateMetrics();
    };

    const handleOverviewMediaChange = (event) => {
      overviewEnabled = event.matches;
      renderOverviewToggle();
    };

    if (typeof compactOverviewQuery.addEventListener === "function") {
      compactOverviewQuery.addEventListener("change", handleOverviewMediaChange);
    } else if (typeof compactOverviewQuery.addListener === "function") {
      compactOverviewQuery.addListener(handleOverviewMediaChange);
    }

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

    demoReplay?.addEventListener("click", async () => {
      if (isRunning) {
        return;
      }

      setBusy(true);
      await replayDemo(demoExplorer, demoCommands);
      setBusy(false);
      renderOverviewToggle();
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
