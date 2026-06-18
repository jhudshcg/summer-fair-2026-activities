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

      this.reset(false);
    }

    buildEmptyState() {
      const state = {
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
      this.paletteOrder = shuffle(this.allPieceIds);
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
      const paletteMeta = {
        ownerId: null,
        socketKey: "palette",
        mode: "sequence",
        acceptKinds: ["statement", "container", "condition", "value"],
        acceptFamilies: [],
      };
      const container = this.createContainer(paletteMeta, "All pieces are in the workspace.");
      const unplaced = this.paletteOrder.filter((pieceId) => !this.isPlaced(pieceId));

      unplaced.forEach((pieceId) => {
        container.append(this.createPieceElement(pieceId));
      });

      this.paletteMount.append(container);
    }

    renderWorkspace() {
      this.workspaceMount.innerHTML = "";
      const surface = document.createElement("div");
      surface.className = `assembly-surface${this.state.root.length === 0 ? " is-empty" : ""}`;
      const rootMeta = {
        ownerId: null,
        socketKey: "root",
        mode: "sequence",
        acceptKinds: ["statement", "container"],
        acceptFamilies: [],
      };
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

    syncPaletteOrder() {
      const paletteIds = this.readContainerPieces(this.containerElements.get("palette"));
      const placedIds = this.allPieceIds.filter((pieceId) => !paletteIds.includes(pieceId));
      this.paletteOrder = [...paletteIds, ...placedIds];
    }

    syncStateFromDom() {
      const nextState = this.buildEmptyState();
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

      this.syncPaletteOrder();
      this.state = nextState;
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

    handleSortMove(event) {
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
      const targetId = event.to?.dataset.containerId;
      const targetMeta = this.containerMetas.get(targetId);

      this.syncStateFromDom();
      this.render();

      if (pieceId && targetMeta) {
        this.onChange({ type: "place", pieceId, slotMeta: targetMeta });
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
        delay: 120,
        delayOnTouchOnly: true,
        touchStartThreshold: 4,
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        dragClass: "sortable-drag",
        onMove: (event) => this.handleSortMove(event),
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
    }
  }

  window.summerFairAssembly = {
    BlockAssemblyEngine,
  };
})();