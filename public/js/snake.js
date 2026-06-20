/*
 * Summer Fair 2026 hidden challenge logic.
 * Runs the mobile-friendly Snake finale and reports completion to shared progress.
 */

(function snakeModule() {
  const ACTIVITY_ID = "hidden-challenge";
  const GRID_SIZE = 14;
  const WIN_SCORE = 8;
  const BASE_TICK_MS = 240;
  const MIN_TICK_MS = 132;
  const TICK_STEP_MS = 12;
  const SWIPE_THRESHOLD = 18;

  const DIRECTION_VECTORS = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  };

  const OPPOSITE_DIRECTIONS = {
    up: "down",
    right: "left",
    down: "up",
    left: "right",
  };

  function normaliseSavedState(rawState) {
    if (!rawState || typeof rawState !== "object") {
      return {
        bestScore: 0,
        lastScore: 0,
        completedAt: "",
      };
    }

    return {
      bestScore: Number.isFinite(rawState.bestScore) ? Math.max(0, rawState.bestScore) : 0,
      lastScore: Number.isFinite(rawState.lastScore) ? Math.max(0, rawState.lastScore) : 0,
      completedAt: typeof rawState.completedAt === "string" ? rawState.completedAt : "",
    };
  }

  function createStartingSnake() {
    return [
      { x: 4, y: 7 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
      { x: 1, y: 7 },
    ];
  }

  function positionsMatch(firstPosition, secondPosition) {
    return firstPosition.x === secondPosition.x && firstPosition.y === secondPosition.y;
  }

  function createEmptyCell(excludedPositions) {
    const excludedKeys = new Set(excludedPositions.map((position) => `${position.x},${position.y}`));
    const availablePositions = [];

    for (let rowIndex = 0; rowIndex < GRID_SIZE; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < GRID_SIZE; columnIndex += 1) {
        const cellKey = `${columnIndex},${rowIndex}`;
        if (!excludedKeys.has(cellKey)) {
          availablePositions.push({ x: columnIndex, y: rowIndex });
        }
      }
    }

    if (!availablePositions.length) {
      return { x: 0, y: 0 };
    }

    return availablePositions[Math.floor(Math.random() * availablePositions.length)];
  }

  function createInitialModel(bestScore) {
    const snake = createStartingSnake();

    return {
      snake,
      food: createEmptyCell(snake),
      direction: "right",
      pendingDirection: "",
      score: 0,
      status: "idle",
      tickMs: BASE_TICK_MS,
      timerId: 0,
      bestScore,
    };
  }

  function getSpeedLabel(tickMs) {
    if (tickMs <= 156) {
      return "Speed: reef rush";
    }

    if (tickMs <= 204) {
      return "Speed: coral cruise";
    }

    return "Speed: lagoon warm-up";
  }

  function initSnake() {
    const app = window.summerFairApp;
    if (!app || document.body?.dataset.page !== ACTIVITY_ID) {
      return;
    }

    const elements = {
      game: document.querySelector("[data-hidden-game]"),
      preview: document.querySelector("[data-hidden-preview]"),
      hint: document.querySelector("[data-page-hint]"),
      board: document.querySelector("[data-snake-board]"),
      caption: document.querySelector("[data-snake-caption]"),
      feedback: document.querySelector("[data-snake-feedback]"),
      score: document.querySelector("[data-snake-score]"),
      best: document.querySelector("[data-snake-best]"),
      target: document.querySelector("[data-snake-target]"),
      speed: document.querySelector("[data-snake-speed]"),
      start: document.querySelector("[data-snake-start]"),
      restart: document.querySelector("[data-snake-restart]"),
      success: document.querySelector("[data-snake-success]"),
      successCopy: document.querySelector("[data-snake-success-copy]"),
      directionButtons: Array.from(document.querySelectorAll("[data-direction]")),
    };

    if (!elements.game || !elements.preview || !elements.hint || !elements.board || !elements.feedback) {
      return;
    }

    if (!app.isHiddenUnlocked(app.getProgress())) {
      elements.game.hidden = true;
      return;
    }

    elements.game.hidden = false;
    elements.preview.textContent = "Guide the reef Snake through the lagoon. Collect 8 reef fruits before the walls or your own tail stop the run.";
    elements.hint.textContent = "Plan one move ahead, and on phones you can swipe across the board instead of tapping the arrow pad.";

    const savedState = normaliseSavedState(app.getActivityState(ACTIVITY_ID));
    const model = createInitialModel(savedState.bestScore);
    const boardCells = [];
    let touchStartPoint = null;
    let persistedState = savedState;

    function saveState(partialState) {
      persistedState = { ...persistedState, ...partialState };
      app.setActivityState(ACTIVITY_ID, persistedState);
    }

    function updateSharedCopy() {
      elements.preview.textContent = "Guide the reef Snake through the lagoon. Collect 8 reef fruits before the walls or your own tail stop the run.";
      elements.hint.textContent = "Plan one move ahead, and on phones you can swipe across the board instead of tapping the arrow pad.";
    }

    function setFeedback(tone, message) {
      elements.feedback.classList.remove("is-error", "is-success");
      if (tone === "error") {
        elements.feedback.classList.add("is-error");
      }
      if (tone === "success") {
        elements.feedback.classList.add("is-success");
      }
      elements.feedback.textContent = message;
    }

    function updateSuccessPanel(replayMode) {
      const hasCompleted = Boolean(app.getProgress().completed?.[ACTIVITY_ID]);

      if (!hasCompleted) {
        elements.success.hidden = true;
        elements.success.classList.remove("is-celebrating");
        return;
      }

      elements.success.hidden = false;
      elements.successCopy.textContent = replayMode
        ? `You already cleared the reef once. Your best run so far is ${persistedState.bestScore} fruit, and you can replay as often as you like.`
        : `You collected all ${WIN_SCORE} reef fruits and unlocked the full tropical finale.`;
    }

    function triggerCelebration() {
      elements.success.hidden = false;
      elements.success.classList.remove("is-celebrating");
      window.requestAnimationFrame(() => {
        elements.success.classList.add("is-celebrating");
      });
    }

    function clearTimer() {
      if (model.timerId) {
        window.clearTimeout(model.timerId);
        model.timerId = 0;
      }
    }

    function scheduleNextTick() {
      clearTimer();
      if (model.status !== "running") {
        return;
      }

      model.timerId = window.setTimeout(() => {
        stepGame();
        scheduleNextTick();
      }, model.tickMs);
    }

    function updateCaption() {
      if (model.status === "idle") {
        elements.caption.textContent = "Press Start run to begin the reef route.";
        return;
      }

      if (model.status === "running") {
        elements.caption.textContent = `${WIN_SCORE - model.score} fruit left. Stay clear of the reef walls.`;
        return;
      }

      if (model.status === "crashed") {
        elements.caption.textContent = "Crash. Restart or tap a direction to try again.";
        return;
      }

      elements.caption.textContent = "Treasure secured. Replay the reef run whenever you want.";
    }

    function renderBoard() {
      const snakeByCell = new Set(model.snake.map((position) => `${position.x},${position.y}`));
      const head = model.snake[0];
      const fruitKey = `${model.food.x},${model.food.y}`;

      boardCells.forEach((cell, index) => {
        const rowIndex = Math.floor(index / GRID_SIZE);
        const columnIndex = index % GRID_SIZE;
        const cellKey = `${columnIndex},${rowIndex}`;

        cell.className = "snake-cell";
        if (snakeByCell.has(cellKey)) {
          cell.classList.add("snake-cell--snake");
        }
        if (fruitKey === cellKey) {
          cell.classList.add("snake-cell--fruit");
        }
        if (head.x === columnIndex && head.y === rowIndex) {
          cell.classList.add("snake-cell--head");
        }
      });

      elements.board.setAttribute("aria-label", `Snake board. Score ${model.score} of ${WIN_SCORE}.`);
    }

    function renderStats() {
      elements.score.textContent = String(model.score);
      elements.best.textContent = String(Math.max(model.bestScore, persistedState.bestScore));
      elements.target.textContent = String(WIN_SCORE);
      elements.speed.textContent = getSpeedLabel(model.tickMs);
      elements.start.disabled = model.status === "running";
      updateCaption();
      renderBoard();
    }

    function recordScore() {
      const nextBestScore = Math.max(model.bestScore, model.score, persistedState.bestScore);
      model.bestScore = nextBestScore;
      saveState({
        bestScore: nextBestScore,
        lastScore: model.score,
        completedAt: persistedState.completedAt,
      });
    }

    function resetGame() {
      clearTimer();
      const freshState = createInitialModel(persistedState.bestScore);
      model.snake = freshState.snake;
      model.food = freshState.food;
      model.direction = freshState.direction;
      model.pendingDirection = freshState.pendingDirection;
      model.score = freshState.score;
      model.status = "idle";
      model.tickMs = freshState.tickMs;
      updateSuccessPanel(Boolean(app.getProgress().completed?.[ACTIVITY_ID]));
      setFeedback("", "Collect 8 reef fruits without crashing into the walls or your own tail.");
      renderStats();
    }

    function startGame() {
      clearTimer();
      updateSuccessPanel(false);
      const freshState = createInitialModel(persistedState.bestScore);
      model.snake = freshState.snake;
      model.food = freshState.food;
      model.direction = freshState.direction;
      model.pendingDirection = freshState.pendingDirection;
      model.score = 0;
      model.status = "running";
      model.tickMs = BASE_TICK_MS;
      setFeedback("", "The reef route is open. Collect fruit and keep moving.");
      renderStats();
      scheduleNextTick();
    }

    function finishRunAsCrash() {
      clearTimer();
      model.status = "crashed";
      recordScore();
      setFeedback("error", "The Snake hit trouble. Restart or tap a new direction to launch another run.");
      renderStats();
      app.scrollToFeedback(elements.feedback);
    }

    function finishRunAsWin() {
      clearTimer();
      model.status = "won";
      recordScore();
      saveState({
        completedAt: new Date().toISOString(),
      });
      app.setCompleted(ACTIVITY_ID, true);
      app.refreshPageChrome();
      updateSharedCopy();
      triggerCelebration();
      updateSuccessPanel(false);
      setFeedback("success", "Treasure unlocked. You completed the hidden reef challenge.");
      renderStats();
      app.scrollToFeedback(elements.success);
    }

    function stepGame() {
      if (model.pendingDirection && OPPOSITE_DIRECTIONS[model.direction] !== model.pendingDirection) {
        model.direction = model.pendingDirection;
      }

      model.pendingDirection = "";

      const movement = DIRECTION_VECTORS[model.direction];
      const nextHead = {
        x: model.snake[0].x + movement.x,
        y: model.snake[0].y + movement.y,
      };

      const willEatFruit = positionsMatch(nextHead, model.food);
      const collisionBody = willEatFruit ? model.snake : model.snake.slice(0, -1);
      const hitsBoundary = nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE;
      const hitsBody = collisionBody.some((position) => positionsMatch(position, nextHead));

      if (hitsBoundary || hitsBody) {
        finishRunAsCrash();
        return;
      }

      model.snake = [nextHead, ...model.snake];

      if (willEatFruit) {
        model.score += 1;
        model.tickMs = Math.max(MIN_TICK_MS, BASE_TICK_MS - model.score * TICK_STEP_MS);

        if (model.score >= WIN_SCORE) {
          finishRunAsWin();
          return;
        }

        model.food = createEmptyCell(model.snake);
        setFeedback("success", `${WIN_SCORE - model.score} fruit left. The reef is speeding up now.`);
      } else {
        model.snake.pop();
      }

      renderStats();
    }

    function queueDirection(direction) {
      if (!DIRECTION_VECTORS[direction]) {
        return;
      }

      if (model.status !== "running") {
        startGame();
      }

      const activeDirection = model.pendingDirection || model.direction;
      if (OPPOSITE_DIRECTIONS[activeDirection] === direction) {
        return;
      }

      model.pendingDirection = direction;
    }

    function handleKeyDown(event) {
      const directionFromKey = {
        ArrowUp: "up",
        ArrowRight: "right",
        ArrowDown: "down",
        ArrowLeft: "left",
        w: "up",
        d: "right",
        s: "down",
        a: "left",
        W: "up",
        D: "right",
        S: "down",
        A: "left",
      }[event.key];

      if (!directionFromKey) {
        return;
      }

      event.preventDefault();
      queueDirection(directionFromKey);
    }

    function handleTouchStart(event) {
      const touch = event.changedTouches[0];
      touchStartPoint = { x: touch.clientX, y: touch.clientY };
    }

    function handleTouchEnd(event) {
      if (!touchStartPoint) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartPoint.x;
      const deltaY = touch.clientY - touchStartPoint.y;
      touchStartPoint = null;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        queueDirection(deltaX > 0 ? "right" : "left");
        return;
      }

      queueDirection(deltaY > 0 ? "down" : "up");
    }

    function buildBoard() {
      elements.board.innerHTML = "";
      for (let cellIndex = 0; cellIndex < GRID_SIZE * GRID_SIZE; cellIndex += 1) {
        const cell = document.createElement("div");
        cell.className = "snake-cell";
        cell.setAttribute("aria-hidden", "true");
        boardCells.push(cell);
        elements.board.append(cell);
      }
    }

    function bindEvents() {
      elements.start.addEventListener("click", startGame);
      elements.restart.addEventListener("click", resetGame);
      elements.directionButtons.forEach((button) => {
        button.addEventListener("click", () => {
          queueDirection(button.dataset.direction);
        });
      });
      elements.board.addEventListener("touchstart", handleTouchStart, { passive: true });
      elements.board.addEventListener("touchend", handleTouchEnd, { passive: true });
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && model.status === "running") {
          clearTimer();
        }
      });
    }

    buildBoard();
    bindEvents();
    resetGame();
    updateSharedCopy();
    if (app.getProgress().completed?.[ACTIVITY_ID]) {
      updateSuccessPanel(true);
    }
  }

  document.addEventListener("DOMContentLoaded", initSnake);
}());