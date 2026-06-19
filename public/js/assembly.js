/*
 * Shared block assembly engine backed by SortableJS.
 * This keeps puzzle-specific validation in app code while delegating touch drag behaviour to a maintained library.
 */

(function () {
  const SORTABLE_GROUP = "summer-fair-assembly";

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
      this.render();

      if (emit) {
        this.onChange({ type: "reset" });
      }
    }

    getSnapshot() {
      return cloneState(this.state);
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
      handle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
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

          const socketLabel = document.createElement("p");
          socketLabel.className = "assembly-container__socket-label";
          socketLabel.textContent = socket.label;
          socketWrap.append(socketLabel);

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

    getSequenceInsertIndex(container, point) {
      if (!container) {
        return 0;
      }

      const children = Array.from(container.children).filter((child) => child.classList.contains("assembly-piece"));
      if (children.length === 0 || !point) {
        return children.length;
      }

      for (let index = 0; index < children.length; index += 1) {
        const rect = children[index].getBoundingClientRect();
        if (point.y < rect.top + rect.height / 2) {
          return index;
        }
      }

      return children.length;
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

    getDistanceToRect(point, rect) {
      const dx = point.x < rect.left ? rect.left - point.x : point.x > rect.right ? point.x - rect.right : 0;
      const dy = point.y < rect.top ? rect.top - point.y : point.y > rect.bottom ? point.y - rect.bottom : 0;
      return Math.hypot(dx, dy);
    }

    resolvePlacementTarget(pieceId, scope, point, exactContainerId = null) {
      const scopeMount = this.getScopeMount(scope);
      if (!scopeMount) {
        return null;
      }

      const exactContainer = exactContainerId ? this.containerElements.get(exactContainerId) : null;
      const exactMeta = exactContainerId ? this.containerMetas.get(exactContainerId) : null;
      if (exactContainer && exactMeta && scopeMount.contains(exactContainer) && this.canPlace(pieceId, exactMeta)) {
        return {
          slotMeta: exactMeta,
          index: exactMeta.mode === "sequence" ? this.getSequenceInsertIndex(exactContainer, point) : 0,
        };
      }

      let bestMatch = null;

      this.containerElements.forEach((container, containerId) => {
        const slotMeta = this.containerMetas.get(containerId);
        if (!slotMeta || !scopeMount.contains(container) || !this.canPlace(pieceId, slotMeta)) {
          return;
        }

        const rect = container.getBoundingClientRect();
        const distance = point ? this.getDistanceToRect(point, rect) : 0;

        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { container, slotMeta, distance };
        }
      });

      if (!bestMatch) {
        return null;
      }

      return {
        slotMeta: bestMatch.slotMeta,
        index: bestMatch.slotMeta.mode === "sequence" ? this.getSequenceInsertIndex(bestMatch.container, point) : 0,
      };
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
        return;
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
      const target = this.resolvePlacementTarget(this.selectedPieceId, scope, point, exactContainerId);

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

    isMoveAllowed(draggedPieceId, targetMeta, targetContainer, sourceContainer) {
      if (!this.canPlace(draggedPieceId, targetMeta)) {
        return false;
      }

      if (targetMeta.mode === "single") {
        const existing = this.readContainerPieces(targetContainer).filter((pieceId) => pieceId !== draggedPieceId);
        if (existing.length > 0 && sourceContainer !== targetContainer) {
          return false;
        }
      }

      return true;
    }

    handleSortMove(event, originalEvent) {
      this.lastPointerPoint = this.getPointFromEvent(originalEvent) || this.lastPointerPoint;

      const draggedPieceId = event.dragged?.dataset.pieceId;
      const targetId = event.to?.dataset.containerId;
      const targetMeta = this.containerMetas.get(targetId);

      if (!draggedPieceId || !targetMeta) {
        return false;
      }

      return this.isMoveAllowed(draggedPieceId, targetMeta, event.to, event.from);
    }

    handleSortEnd(event) {
      const pieceId = event.item?.dataset.pieceId;
      const targetId = event.to?.dataset.containerId || null;
      const targetMeta = this.containerMetas.get(targetId);
      const point = this.lastPointerPoint || this.getPointFromEvent(event.originalEvent);
      const scope = this.getScopeForPoint(point);

      this.syncStateFromDom();

      let finalTargetMeta = targetMeta;

      if (pieceId && scope) {
        const resolved = this.resolvePlacementTarget(pieceId, scope, point, scope === "workspace" ? targetId : null);

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

      this.lastPointerPoint = null;
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
        handle: ".assembly-piece__handle",
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
        onMove: (event, originalEvent) => this.handleSortMove(event, originalEvent),
        onEnd: (event) => this.handleSortEnd(event),
      });
    }

    destroySortables() {
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
  };
})();