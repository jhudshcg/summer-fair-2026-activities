/*
 * Shared block assembly engine backed by SortableJS.
 * This keeps puzzle-specific validation in app code while delegating touch drag behaviour to a maintained library.
 */

(function () {
  const SORTABLE_GROUP = "summer-fair-assembly";
  const REPLACEMENT_GAP_THRESHOLD = 10;
  const SEQUENCE_INSERT_BAND = 18;
  const ASSEMBLY_VOCABULARY = Object.freeze({
    families: {
      repeat: "repeat",
      choice: "choice",
    },
    kickers: {
      repeat: "Repeat",
      choice: "Choice",
      step: "Step",
      condition: "Condition",
      number: "Number",
    },
    labels: {
      repeatCount: "for count",
      untilFinish: "until finish",
      choice: "",
      ifOnly: "",
    },
    socketLabels: {
      repeatHeader: "",
      repeatBody: "Inside this loop",
      choiceHeader: "If",
      choiceTrue: "Is true",
      choiceOtherwise: "Otherwise",
      number: "Number",
    },
    emptyLabels: {
      condition: "Drop a condition here",
      stepInLoop: "Drop a step into this loop",
      stepInPath: "Drop a step into this path",
      optionalPath: "Optional other path",
      number: "Drop a number here",
    },
  });

  function shuffle(items) {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
  }

  function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // Shared assembly state and placement rules live here so puzzles only provide piece data and validation.
  class BlockAssemblyEngine {
    constructor(options) {
      if (!window.Sortable) {
        throw new Error("SortableJS is required before loading the shared assembly engine.");
      }

      this.options = options;
      this.paletteMount = options.paletteMount;
      this.workspaceMount = options.workspaceMount;
      this.onChange = options.onChange || (() => {});
      this.piecesById = new Map(options.pieces.map((piece) => [piece.id, piece]));
      this.allPieceIds = options.pieces.map((piece) => piece.id);
      this.sortables = [];
      this.containerElements = new Map();
      this.containerMetas = new Map();
      this.selectedPieceId = null;
      this.lastPointerPoint = null;
      this.lastDragRect = null;
      this.activeResolvedTarget = null;
      this.activeDragPieceId = null;
      this.activeDragElement = null;
      this.replacementGapThreshold = options.replacementGapThreshold ?? REPLACEMENT_GAP_THRESHOLD;
      this.handleTrackedDragMove = (event) => {
        this.handleGlobalDragMove(event);
      };

      this.bindMountEvents();

      this.reset(false);
    }

    bindMountEvents() {
      this.paletteMount?.addEventListener("click", (event) => {
        this.handleScopeClick(event, "palette");
      });

      this.workspaceMount?.addEventListener("click", (event) => {
        this.handleScopeClick(event, "workspace");
      });
    }

    buildEmptyState() {
      const state = {
        palette: [],
        root: [],
        sockets: {},
        values: {},
      };

      this.allPieceIds.forEach((pieceId) => {
        const piece = this.piecesById.get(pieceId);
        if (piece.input) {
          state.values[pieceId] = piece.input.defaultValue ?? "";
        }

        if (!piece.sockets) {
          return;
        }

        state.sockets[pieceId] = {};
        piece.sockets.forEach((socket) => {
          state.sockets[pieceId][socket.key] = socket.mode === "single" ? null : [];
        });
      });

      return state;
    }

    reset(emit = true) {
      this.state = this.buildEmptyState();
      this.state.palette = shuffle(this.allPieceIds);
      this.selectedPieceId = null;
      this.lastPointerPoint = null;
      this.lastDragRect = null;
      this.activeResolvedTarget = null;
      this.stopDragTracking();
      this.render();

      if (emit) {
        this.onChange({ type: "reset" });
      }
    }

    getSnapshot() {
      return cloneState(this.state);
    }

    buildRestoredState(snapshot) {
      const nextState = this.buildEmptyState();
      if (!snapshot || typeof snapshot !== "object") {
        return nextState;
      }

      Object.keys(nextState.values).forEach((pieceId) => {
        const savedValue = snapshot.values?.[pieceId];
        if (savedValue === undefined || savedValue === null) {
          return;
        }

        nextState.values[pieceId] = String(savedValue);
      });

      const placedPieceIds = new Set();
      const restorePiece = (pieceId) => {
        if (!this.piecesById.has(pieceId) || placedPieceIds.has(pieceId)) {
          return null;
        }

        placedPieceIds.add(pieceId);
        const piece = this.getPiece(pieceId);
        if (!piece?.sockets) {
          return pieceId;
        }

        const savedSockets = snapshot.sockets?.[pieceId] || {};
        piece.sockets.forEach((socket) => {
          if (socket.mode === "single") {
            nextState.sockets[pieceId][socket.key] = restorePiece(savedSockets[socket.key]) || null;
            return;
          }

          const savedSequence = Array.isArray(savedSockets[socket.key]) ? savedSockets[socket.key] : [];
          nextState.sockets[pieceId][socket.key] = savedSequence
            .map((childId) => restorePiece(childId))
            .filter(Boolean);
        });

        return pieceId;
      };

      const savedRoot = Array.isArray(snapshot.root) ? snapshot.root : [];
      nextState.root = savedRoot.map((pieceId) => restorePiece(pieceId)).filter(Boolean);

      const savedPalette = Array.isArray(snapshot.palette) ? snapshot.palette : [];
      nextState.palette = savedPalette.map((pieceId) => restorePiece(pieceId)).filter(Boolean);

      this.allPieceIds.forEach((pieceId) => {
        if (!placedPieceIds.has(pieceId)) {
          nextState.palette.push(pieceId);
        }
      });

      return nextState;
    }

    restoreSnapshot(snapshot, emit = false) {
      this.state = this.buildRestoredState(snapshot);
      this.selectedPieceId = null;
      this.lastPointerPoint = null;
      this.lastDragRect = null;
      this.activeResolvedTarget = null;
      this.stopDragTracking();
      this.render();

      if (emit) {
        this.onChange({ type: "restore" });
      }
    }

    getPiece(pieceId) {
      return this.piecesById.get(pieceId);
    }

    isPlaced(pieceId) {
      return Boolean(this.findPieceLocation(pieceId));
    }

    findPieceLocation(pieceId) {
      const paletteIndex = this.state.palette.indexOf(pieceId);
      if (paletteIndex >= 0) {
        return { parentType: "palette", ownerId: null, socketKey: "palette", index: paletteIndex, mode: "sequence" };
      }

      const rootIndex = this.state.root.indexOf(pieceId);
      if (rootIndex >= 0) {
        return { parentType: "root", ownerId: null, socketKey: "root", index: rootIndex, mode: "sequence" };
      }

      // Walk downward through nested sockets and report the immediate owner of the requested piece.
      const searchOwner = (ownerId) => {
        const socketState = this.state.sockets[ownerId];
        if (!socketState) {
          return null;
        }

        for (const [socketKey, value] of Object.entries(socketState)) {
          if (Array.isArray(value)) {
            const index = value.indexOf(pieceId);
            if (index >= 0) {
              return { parentType: "piece", ownerId, socketKey, index, mode: "sequence" };
            }

            for (const childId of value) {
              const found = searchOwner(childId);
              if (found) {
                return found;
              }
            }
          } else {
            if (value === pieceId) {
              return { parentType: "piece", ownerId, socketKey, index: 0, mode: "single" };
            }

            if (value) {
              const found = searchOwner(value);
              if (found) {
                return found;
              }
            }
          }
        }

        return null;
      };

      for (const topLevelId of this.state.root) {
        const found = searchOwner(topLevelId);
        if (found) {
          return found;
        }
      }

      for (const topLevelId of this.state.palette) {
        const found = searchOwner(topLevelId);
        if (found) {
          return found;
        }
      }

      return null;
    }

    getDescendants(pieceId, set = new Set()) {
      const socketState = this.state.sockets[pieceId];
      if (!socketState) {
        return set;
      }

      Object.values(socketState).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((childId) => {
            set.add(childId);
            this.getDescendants(childId, set);
          });
        } else if (value) {
          set.add(value);
          this.getDescendants(value, set);
        }
      });

      return set;
    }

    canPlace(pieceId, slotMeta) {
      const piece = this.getPiece(pieceId);
      if (!piece || !slotMeta) {
        return false;
      }

      if (!slotMeta.acceptKinds.includes(piece.kind)) {
        return false;
      }

      if (slotMeta.acceptFamilies?.length && !slotMeta.acceptFamilies.includes(piece.family)) {
        return false;
      }

      if (slotMeta.ownerId === pieceId) {
        return false;
      }

      if (slotMeta.ownerId && this.getDescendants(pieceId).has(slotMeta.ownerId)) {
        return false;
      }

      return true;
    }

    getContainerId(ownerId, socketKey) {
      if (socketKey === "palette") {
        return "palette";
      }

      if (ownerId === null) {
        return socketKey;
      }

      return `${ownerId}::${socketKey}`;
    }

    createContainer(meta, emptyLabel, isRootStart = false) {
      const container = document.createElement("div");
      const containerId = this.getContainerId(meta.ownerId, meta.socketKey);
      container.className = "assembly-sequence assembly-sortable";
      container.dataset.containerId = containerId;
      container.dataset.emptyLabel = emptyLabel;
      container.dataset.rootStart = isRootStart ? "true" : "false";

      if (meta.mode === "single") {
        container.classList.add("assembly-sortable--single");
      } else {
        container.classList.add("assembly-sortable--sequence");
      }

      this.containerElements.set(containerId, container);
      this.containerMetas.set(containerId, meta);
      return container;
    }

    createPieceElement(pieceId) {
      const piece = this.getPiece(pieceId);
      const element = document.createElement("div");
      element.className = `assembly-piece assembly-piece--${piece.kind}`;
      element.dataset.pieceId = pieceId;
      element.addEventListener("click", (event) => {
        this.handlePieceClick(event, pieceId);
      });

      const handle = document.createElement("span");
      handle.className = "assembly-piece__handle";
      handle.setAttribute("aria-hidden", "true");
      element.append(handle);

      if (piece.kicker) {
        const kicker = document.createElement("p");
        kicker.className = "assembly-piece__kicker";
        kicker.textContent = piece.kicker;
        element.append(kicker);
      }

      if (piece.label) {
        const label = document.createElement("p");
        label.className = "assembly-piece__label";
        label.textContent = piece.label;
        element.append(label);
      }

      if (piece.input) {
        const field = document.createElement("label");
        field.className = "assembly-piece__field";

        const input = document.createElement("input");
        input.className = "assembly-piece__input";
        input.dataset.pieceInputFor = pieceId;
        input.type = piece.input.type || "text";
        input.inputMode = piece.input.inputMode || "text";
        input.min = piece.input.min ?? "";
        input.max = piece.input.max ?? "";
        input.step = piece.input.step ?? "1";
        input.placeholder = piece.input.placeholder || "";
        input.value = this.state.values[pieceId] ?? piece.input.defaultValue ?? "";
        input.setAttribute("aria-label", piece.input.ariaLabel || piece.label);
        if (piece.input.maxLength) {
          input.maxLength = piece.input.maxLength;
        }

        // Inputs keep their own pointer/key events so editing values does not trigger selection or dragging.
        ["pointerdown", "mousedown", "touchstart", "click", "keydown"].forEach((eventName) => {
          input.addEventListener(eventName, (event) => {
            event.stopPropagation();
          });
        });

        input.addEventListener("input", () => {
          this.state.values[pieceId] = input.value;
          this.onChange({ type: "value", pieceId, value: input.value });
        });

        field.append(input);
        element.append(field);
      }

      if (piece.sockets) {
        piece.sockets.forEach((socket) => {
          const socketWrap = document.createElement("section");
          socketWrap.className = `assembly-container__socket assembly-container__socket--${socket.mode}`;

          if (socket.label) {
            const socketLabel = document.createElement("p");
            socketLabel.className = "assembly-container__socket-label";
            socketLabel.textContent = socket.label;
            socketWrap.append(socketLabel);
          }

          const socketMeta = {
            ownerId: pieceId,
            socketKey: socket.key,
            mode: socket.mode,
            acceptKinds: socket.acceptKinds,
            acceptFamilies: socket.acceptFamilies || [],
          };
          const container = this.createContainer(socketMeta, socket.emptyLabel);

          if (socket.mode === "single") {
            const childId = this.state.sockets[pieceId][socket.key];
            if (childId) {
              container.append(this.createPieceElement(childId));
            }
          } else {
            this.state.sockets[pieceId][socket.key].forEach((childId) => {
              container.append(this.createPieceElement(childId));
            });
          }

          socketWrap.append(container);
          element.append(socketWrap);
        });
      }

      return element;
    }

    renderPalette() {
      this.paletteMount.innerHTML = "";
      const paletteMeta = this.getPaletteMeta();
      const container = this.createContainer(paletteMeta, "All pieces are in the workspace.");

      this.state.palette.forEach((pieceId) => {
        container.append(this.createPieceElement(pieceId));
      });

      this.paletteMount.append(container);
    }

    renderWorkspace() {
      this.workspaceMount.innerHTML = "";
      const surface = document.createElement("div");
      surface.className = `assembly-surface${this.state.root.length === 0 ? " is-empty" : ""}`;
      const rootMeta = this.getRootMeta();
      const container = this.createContainer(
        rootMeta,
        this.state.root.length === 0 ? "Drop the first block here" : "Drop a block here",
        true
      );

      this.state.root.forEach((pieceId) => {
        container.append(this.createPieceElement(pieceId));
      });

      surface.append(container);
      this.workspaceMount.append(surface);
    }

    readContainerPieces(container) {
      if (!container) {
        return [];
      }

      return Array.from(container.children)
        .filter((child) => child.classList.contains("assembly-piece"))
        .map((child) => child.dataset.pieceId);
    }

    // Ghost placeholders help Sortable show provisional spacing, but they must not become semantic targets.
    getMaterialContainerPieces(container) {
      if (!container) {
        return [];
      }

      return Array.from(container.children).filter((child) => {
        return child.classList.contains("assembly-piece") && !child.classList.contains("sortable-ghost");
      });
    }

    // Sortable mutates the DOM first, so drag completion rebuilds the canonical state from the current containers.
    syncStateFromDom() {
      const nextState = this.buildEmptyState();
      nextState.palette = this.readContainerPieces(this.containerElements.get("palette"));
      nextState.root = this.readContainerPieces(this.containerElements.get("root"));
      nextState.values = this.readInputValues(nextState.values);

      this.allPieceIds.forEach((pieceId) => {
        const piece = this.getPiece(pieceId);
        if (!piece.sockets) {
          return;
        }

        piece.sockets.forEach((socket) => {
          const containerId = this.getContainerId(pieceId, socket.key);
          const pieceIds = this.readContainerPieces(this.containerElements.get(containerId));
          nextState.sockets[pieceId][socket.key] = socket.mode === "single" ? pieceIds[0] || null : pieceIds;
        });
      });

      this.state = nextState;
    }

    getPaletteMeta() {
      return {
        ownerId: null,
        socketKey: "palette",
        mode: "sequence",
        acceptKinds: ["statement", "container", "condition", "value"],
        acceptFamilies: [],
      };
    }

    getRootMeta() {
      return {
        ownerId: null,
        socketKey: "root",
        mode: "sequence",
        acceptKinds: ["statement", "container"],
        acceptFamilies: [],
      };
    }

    getMetaForLocation(location) {
      if (!location) {
        return null;
      }

      if (location.parentType === "palette") {
        return this.getPaletteMeta();
      }

      if (location.parentType === "root") {
        return this.getRootMeta();
      }

      return this.containerMetas.get(this.getContainerId(location.ownerId, location.socketKey)) || null;
    }

    readInputValues(seedValues = {}) {
      const nextValues = { ...seedValues };
      [this.paletteMount, this.workspaceMount].forEach((mount) => {
        if (!mount) {
          return;
        }

        mount.querySelectorAll("[data-piece-input-for]").forEach((input) => {
          nextValues[input.dataset.pieceInputFor] = input.value;
        });
      });

      return nextValues;
    }

    removePieceFromState(state, pieceId) {
      const removeFromSequence = (sequence) => {
        const index = sequence.indexOf(pieceId);
        if (index >= 0) {
          sequence.splice(index, 1);
          return true;
        }

        return false;
      };

      if (removeFromSequence(state.palette) || removeFromSequence(state.root)) {
        return;
      }

      this.allPieceIds.some((ownerId) => {
        const socketState = state.sockets[ownerId];
        if (!socketState) {
          return false;
        }

        return Object.keys(socketState).some((socketKey) => {
          const value = socketState[socketKey];
          if (Array.isArray(value)) {
            return removeFromSequence(value);
          }

          if (value === pieceId) {
            socketState[socketKey] = null;
            return true;
          }

          return false;
        });
      });
    }

    insertPieceIntoState(state, pieceId, targetMeta, index = 0) {
      if (targetMeta.socketKey === "palette") {
        state.palette.splice(Math.max(0, Math.min(index, state.palette.length)), 0, pieceId);
        return;
      }

      if (targetMeta.ownerId === null && targetMeta.socketKey === "root") {
        state.root.splice(Math.max(0, Math.min(index, state.root.length)), 0, pieceId);
        return;
      }

      const slot = state.sockets[targetMeta.ownerId][targetMeta.socketKey];
      if (Array.isArray(slot)) {
        slot.splice(Math.max(0, Math.min(index, slot.length)), 0, pieceId);
        return;
      }

      state.sockets[targetMeta.ownerId][targetMeta.socketKey] = pieceId;
    }

    getSingleSocketOccupant(state, targetMeta) {
      if (targetMeta.mode !== "single") {
        return null;
      }

      return state.sockets[targetMeta.ownerId]?.[targetMeta.socketKey] || null;
    }

    getPointFromEvent(event) {
      const source = event?.changedTouches?.[0] || event?.touches?.[0] || event;
      if (typeof source?.clientX !== "number" || typeof source?.clientY !== "number") {
        return null;
      }

      return { x: source.clientX, y: source.clientY };
    }

    getScopeForPoint(point) {
      if (!point) {
        return null;
      }

      const isInside = (mount) => {
        if (!mount) {
          return false;
        }

        const rect = mount.getBoundingClientRect();
        return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
      };

      if (isInside(this.workspaceMount)) {
        return "workspace";
      }

      if (isInside(this.paletteMount)) {
        return "palette";
      }

      return null;
    }

    getScopeMount(scope) {
      return scope === "workspace" ? this.workspaceMount : this.paletteMount;
    }

    createRect(left, top, right, bottom) {
      return {
        left,
        top,
        right,
        bottom,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
      };
    }

    getRectFromPoint(point) {
      if (!point) {
        return null;
      }

      return this.createRect(point.x, point.y, point.x, point.y);
    }

    isPointInsideRect(point, rect) {
      if (!point || !rect) {
        return false;
      }

      return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
    }

    getRectGap(sourceRect, targetRect) {
      if (!sourceRect || !targetRect) {
        return Number.POSITIVE_INFINITY;
      }

      const dx = sourceRect.right < targetRect.left
        ? targetRect.left - sourceRect.right
        : targetRect.right < sourceRect.left
          ? sourceRect.left - targetRect.right
          : 0;
      const dy = sourceRect.bottom < targetRect.top
        ? targetRect.top - sourceRect.bottom
        : targetRect.bottom < sourceRect.top
          ? sourceRect.top - targetRect.bottom
          : 0;

      return Math.hypot(dx, dy);
    }

    getPieceElement(pieceId) {
      for (const mount of [this.paletteMount, this.workspaceMount]) {
        const element = mount?.querySelector(`[data-piece-id="${pieceId}"]`);
        if (element) {
          return element;
        }
      }

      return null;
    }

    getDragRect(draggedElement, point) {
      const liveDragElement = document.querySelector(".sortable-fallback") || document.querySelector(".sortable-drag");
      const rectSource = liveDragElement || draggedElement;
      if (rectSource) {
        return rectSource.getBoundingClientRect();
      }

      return this.getRectFromPoint(point);
    }

    getSequenceCandidateRect(containerRect, lineY) {
      const halfBand = SEQUENCE_INSERT_BAND / 2;
      return this.createRect(
        containerRect.left,
        Math.max(containerRect.top, lineY - halfBand),
        containerRect.right,
        Math.min(containerRect.bottom, lineY + halfBand)
      );
    }

    buildSequenceCandidates(container, slotMeta) {
      const containerRect = container.getBoundingClientRect();
      const children = this.getMaterialContainerPieces(container);

      if (children.length === 0) {
        return [{
          container,
          containerId: container.dataset.containerId,
          slotMeta,
          index: 0,
          rect: containerRect,
          occupantPieceId: null,
          occupantRect: null,
        }];
      }

      const childRects = children.map((child) => child.getBoundingClientRect());
      const insertionLines = [
        childRects[0].top > containerRect.top
          ? (containerRect.top + childRects[0].top) / 2
          : childRects[0].top,
      ];
      for (let index = 1; index < childRects.length; index += 1) {
        insertionLines.push((childRects[index - 1].bottom + childRects[index].top) / 2);
      }
      insertionLines.push(
        childRects[childRects.length - 1].bottom < containerRect.bottom
          ? (childRects[childRects.length - 1].bottom + containerRect.bottom) / 2
          : childRects[childRects.length - 1].bottom,
      );

      return insertionLines.map((lineY, index) => ({
        container,
        containerId: container.dataset.containerId,
        slotMeta,
        index,
        rect: this.getSequenceCandidateRect(containerRect, lineY),
        occupantPieceId: null,
        occupantRect: null,
      }));
    }

    buildSingleCandidate(container, slotMeta, draggedPieceId) {
      const occupantElement = this.getMaterialContainerPieces(container).find((child) => {
        return child.classList.contains("assembly-piece") && child.dataset.pieceId !== draggedPieceId;
      });

      return {
        container,
        containerId: container.dataset.containerId,
        slotMeta,
        index: 0,
        rect: occupantElement?.getBoundingClientRect() || container.getBoundingClientRect(),
        occupantPieceId: occupantElement?.dataset.pieceId || null,
        occupantRect: occupantElement?.getBoundingClientRect() || null,
      };
    }

    // Build every structurally valid landing option in the requested column before choosing a winner.
    collectPlacementCandidates(pieceId, scope) {
      const scopeMount = this.getScopeMount(scope);
      if (!scopeMount) {
        return [];
      }

      const candidates = [];
      this.containerElements.forEach((container, containerId) => {
        const slotMeta = this.containerMetas.get(containerId);
        if (!slotMeta || !scopeMount.contains(container) || !this.canPlace(pieceId, slotMeta)) {
          return;
        }

        if (slotMeta.mode === "sequence") {
          candidates.push(...this.buildSequenceCandidates(container, slotMeta));
          return;
        }

        candidates.push(this.buildSingleCandidate(container, slotMeta, pieceId));
      });

      return candidates;
    }

    chooseBestCandidate(candidates, draggedRect, point, exactContainerId = null, preferExactContainer = false) {
      let bestMatch = null;

      candidates.forEach((candidate) => {
        const distance = this.getRectGap(draggedRect, candidate.rect);
        const exactPriority = preferExactContainer && exactContainerId === candidate.containerId && this.isPointInsideRect(point, candidate.rect) ? 1 : 0;

        if (
          !bestMatch
          || exactPriority > bestMatch.exactPriority
          || (exactPriority === bestMatch.exactPriority && distance < bestMatch.distance)
        ) {
          bestMatch = { candidate, distance, exactPriority };
        }
      });

      return bestMatch?.candidate || null;
    }

    // Replacement is intentional only when the dragged block is truly on top of a compatible occupant.
    resolvePlacementTarget(pieceId, scope, options = {}) {
      const point = options.point || null;
      const draggedRect = options.dragRect || this.getDragRect(options.draggedElement, point);
      const candidates = this.collectPlacementCandidates(pieceId, scope);
      if (!candidates.length) {
        return null;
      }

      const replacementCandidates = candidates.filter((candidate) => {
        if (!candidate.occupantPieceId) {
          return false;
        }

        return this.getRectGap(draggedRect, candidate.occupantRect || candidate.rect) <= this.replacementGapThreshold;
      });

      const unoccupiedCandidates = candidates.filter((candidate) => !candidate.occupantPieceId);
      const pool = replacementCandidates.length > 0 ? replacementCandidates : unoccupiedCandidates;
      const bestMatch = this.chooseBestCandidate(
        pool,
        draggedRect,
        point,
        options.exactContainerId || null,
        options.preferExactContainer || false
      );

      if (!bestMatch) {
        return null;
      }

      return {
        slotMeta: bestMatch.slotMeta,
        index: bestMatch.index,
        candidate: bestMatch,
      };
    }

    clearResolvedTargetHighlight() {
      [this.paletteMount, this.workspaceMount].forEach((mount) => {
        if (!mount) {
          return;
        }

        mount.querySelectorAll(".is-drop-target, .is-replacement-target, .is-insert-before, .is-insert-after").forEach((element) => {
          element.classList.remove("is-drop-target", "is-replacement-target", "is-insert-before", "is-insert-after");
        });

        mount.querySelectorAll("[data-insert-marker]").forEach((element) => {
          delete element.dataset.insertMarker;
        });
      });
    }

    applyResolvedTargetHighlight(resolvedTarget) {
      this.clearResolvedTargetHighlight();
      if (!resolvedTarget?.candidate) {
        return;
      }

      const { candidate } = resolvedTarget;
      const container = this.containerElements.get(candidate.containerId);
      if (!container) {
        return;
      }

      if (candidate.occupantPieceId) {
        container.classList.add("is-drop-target");
        const occupantElement = this.getPieceElement(candidate.occupantPieceId);
        occupantElement?.classList.add("is-replacement-target");
        return;
      }

      if (candidate.slotMeta.mode !== "sequence") {
        container.classList.add("is-drop-target");
        return;
      }

      const pieces = this.getMaterialContainerPieces(container);
      if (pieces.length === 0) {
        container.classList.add("is-drop-target");
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const markerY = ((candidate.rect.top + candidate.rect.bottom) / 2) - containerRect.top;
      container.dataset.insertMarker = "line";
      container.style.setProperty("--assembly-insert-marker-y", `${markerY}px`);
    }

    startDragTracking(pieceId, draggedElement) {
      this.activeDragPieceId = pieceId;
      this.activeDragElement = draggedElement;
      window.addEventListener("mousemove", this.handleTrackedDragMove, { passive: true });
      window.addEventListener("touchmove", this.handleTrackedDragMove, { passive: true });
    }

    stopDragTracking() {
      window.removeEventListener("mousemove", this.handleTrackedDragMove);
      window.removeEventListener("touchmove", this.handleTrackedDragMove);
      this.activeDragPieceId = null;
      this.activeDragElement = null;
    }

    // Sortable's move callback is not continuous inside one container, so highlighting needs its own light retarget pass.
    handleGlobalDragMove(event) {
      if (!this.activeDragPieceId) {
        return;
      }

      const point = this.getPointFromEvent(event) || this.lastPointerPoint;
      if (!point) {
        return;
      }

      this.lastPointerPoint = point;
      this.lastDragRect = this.getDragRect(this.activeDragElement, point);

      const scope = this.getScopeForPoint(point);
      if (!scope) {
        this.activeResolvedTarget = null;
        this.clearResolvedTargetHighlight();
        return;
      }

      const resolved = this.resolvePlacementTarget(this.activeDragPieceId, scope, {
        point,
        dragRect: this.lastDragRect,
        draggedElement: this.activeDragElement,
      });

      this.activeResolvedTarget = resolved ? { ...resolved, pieceId: this.activeDragPieceId, scope } : null;
      this.applyResolvedTargetHighlight(this.activeResolvedTarget);
    }

    movePiece(pieceId, targetMeta, index = 0) {
      const sourceLocation = this.findPieceLocation(pieceId);
      if (!sourceLocation || !this.canPlace(pieceId, targetMeta)) {
        return { success: false };
      }

      const nextState = cloneState(this.state);
      const sourceMeta = this.getMetaForLocation(sourceLocation);
      const displacedPieceId = this.getSingleSocketOccupant(nextState, targetMeta);

      this.removePieceFromState(nextState, pieceId);

      if (displacedPieceId && displacedPieceId !== pieceId) {
        this.removePieceFromState(nextState, displacedPieceId);
      }

      this.insertPieceIntoState(nextState, pieceId, targetMeta, index);

      if (displacedPieceId && displacedPieceId !== pieceId) {
        if (sourceMeta && this.canPlace(displacedPieceId, sourceMeta)) {
          this.insertPieceIntoState(nextState, displacedPieceId, sourceMeta, sourceLocation.index);
        } else {
          this.insertPieceIntoState(nextState, displacedPieceId, this.getPaletteMeta(), nextState.palette.length);
        }
      }

      this.state = nextState;
      this.render();
      return { success: true, displacedPieceId: displacedPieceId && displacedPieceId !== pieceId ? displacedPieceId : null };
    }

    emitPlacementRejected(pieceId) {
      this.onChange({
        type: "reject",
        pieceId,
        message: "That block cannot go anywhere useful in that column yet.",
      });
    }

    handlePieceClick(event, pieceId) {
      if (this.selectedPieceId && this.selectedPieceId !== pieceId) {
        const clickedLocation = this.findPieceLocation(pieceId);
        const clickedMeta = this.getMetaForLocation(clickedLocation);

        // A click on an occupied compatible slot should bubble so scope click can treat it as placement/replacement.
        if (clickedMeta && this.canPlace(this.selectedPieceId, clickedMeta)) {
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();
      this.selectedPieceId = this.selectedPieceId === pieceId ? null : pieceId;
      this.refreshSelectionState();
    }

    handleScopeClick(event, scope) {
      if (!this.selectedPieceId) {
        return;
      }

      const exactContainerId = event.target.closest("[data-container-id]")?.dataset.containerId || null;
      const point = this.getPointFromEvent(event);
      const target = this.resolvePlacementTarget(this.selectedPieceId, scope, {
        point,
        dragRect: this.getRectFromPoint(point),
        exactContainerId,
        preferExactContainer: true,
      });

      if (!target) {
        this.emitPlacementRejected(this.selectedPieceId);
        return;
      }

      const pieceId = this.selectedPieceId;
      const result = this.movePiece(pieceId, target.slotMeta, target.index);
      if (!result.success) {
        this.emitPlacementRejected(pieceId);
        return;
      }

      this.selectedPieceId = null;
      this.refreshSelectionState();
      this.onChange({ type: "place", pieceId, slotMeta: target.slotMeta });
    }

    refreshSelectionState() {
      [this.paletteMount, this.workspaceMount].forEach((mount) => {
        mount?.querySelectorAll(".assembly-piece").forEach((piece) => {
          piece.classList.toggle("is-selected", piece.dataset.pieceId === this.selectedPieceId);
        });
      });
    }

    updateEmptyStates() {
      this.containerElements.forEach((container) => {
        const isEmpty = this.readContainerPieces(container).length === 0;
        const isRootStart = container.dataset.rootStart === "true";

        container.classList.toggle("assembly-slot", isEmpty);
        container.classList.toggle("assembly-sortable--empty", isEmpty);
        container.classList.toggle("is-root-start", isEmpty && isRootStart);
      });
    }

    isMoveAllowed(draggedPieceId, targetMeta) {
      return Boolean(targetMeta) && this.canPlace(draggedPieceId, targetMeta);
    }

    handleSortMove(event, originalEvent) {
      const point = this.getPointFromEvent(originalEvent) || this.lastPointerPoint;
      this.lastPointerPoint = point;
      this.lastDragRect = this.getDragRect(event.dragged, point);

      const draggedPieceId = event.dragged?.dataset.pieceId;
      const targetId = event.to?.dataset.containerId;
      const targetMeta = this.containerMetas.get(targetId);
      const scope = this.getScopeForPoint(point);

      if (draggedPieceId && scope) {
        const resolved = this.resolvePlacementTarget(draggedPieceId, scope, {
          point,
          dragRect: this.lastDragRect,
          draggedElement: event.dragged,
        });

        this.activeResolvedTarget = resolved ? { ...resolved, pieceId: draggedPieceId, scope } : null;
        this.applyResolvedTargetHighlight(this.activeResolvedTarget);
      } else {
        this.activeResolvedTarget = null;
        this.clearResolvedTargetHighlight();
      }

      if (!draggedPieceId || !targetMeta) {
        return false;
      }

      return this.isMoveAllowed(draggedPieceId, targetMeta);
    }

    handleSortEnd(event) {
      const pieceId = event.item?.dataset.pieceId;
      const targetId = event.to?.dataset.containerId || null;
      const targetMeta = this.containerMetas.get(targetId);
      const point = this.lastPointerPoint || this.getPointFromEvent(event.originalEvent);
      const scope = this.getScopeForPoint(point);
      const resolvedFromMove = this.activeResolvedTarget?.pieceId === pieceId && this.activeResolvedTarget.scope === scope
        ? this.activeResolvedTarget
        : null;

      this.syncStateFromDom();

      let finalTargetMeta = targetMeta;

      if (pieceId && scope) {
        const resolved = resolvedFromMove || this.resolvePlacementTarget(pieceId, scope, {
          point,
          dragRect: this.lastDragRect,
          exactContainerId: scope === "workspace" ? targetId : null,
        });

        if (resolved) {
          const result = this.movePiece(pieceId, resolved.slotMeta, resolved.index);
          if (result.success) {
            finalTargetMeta = resolved.slotMeta;
          }
        } else if (scope !== "palette") {
          this.render();
          this.emitPlacementRejected(pieceId);
          finalTargetMeta = null;
        } else {
          this.render();
        }
      } else {
        this.render();
      }

      this.stopDragTracking();
      this.clearResolvedTargetHighlight();
      this.lastPointerPoint = null;
      this.lastDragRect = null;
      this.activeResolvedTarget = null;
      this.selectedPieceId = null;
      this.refreshSelectionState();

      if (pieceId && finalTargetMeta) {
        this.onChange({ type: "place", pieceId, slotMeta: finalTargetMeta });
      }
    }

    createSortable(container, meta) {
      return window.Sortable.create(container, {
        group: SORTABLE_GROUP,
        animation: 150,
        draggable: ".assembly-piece",
        sort: meta.mode !== "single",
        fallbackOnBody: true,
        forceFallback: true,
        swapThreshold: 0.65,
        invertSwap: true,
        emptyInsertThreshold: 12,
        delay: 0,
        delayOnTouchOnly: true,
        touchStartThreshold: 3,
        fallbackTolerance: 6,
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        dragClass: "sortable-drag",
        onStart: (event) => {
          this.startDragTracking(event.item?.dataset.pieceId || null, event.item || null);
        },
        onMove: (event, originalEvent) => this.handleSortMove(event, originalEvent),
        onEnd: (event) => this.handleSortEnd(event),
      });
    }

    destroySortables() {
      this.stopDragTracking();
      this.sortables.forEach((sortable) => sortable.destroy());
      this.sortables = [];
    }

    initSortables() {
      this.containerElements.forEach((container, containerId) => {
        const meta = this.containerMetas.get(containerId);
        this.sortables.push(this.createSortable(container, meta));
      });
    }

    render() {
      this.destroySortables();
      this.activeResolvedTarget = null;
      this.containerElements = new Map();
      this.containerMetas = new Map();
      this.renderPalette();
      this.renderWorkspace();
      this.updateEmptyStates();
      this.initSortables();
      this.refreshSelectionState();
    }
  }

  window.summerFairAssembly = {
    BlockAssemblyEngine,
    vocabulary: ASSEMBLY_VOCABULARY,
  };
})();