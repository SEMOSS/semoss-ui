import type { StoreApi } from "zustand";
import { shallow } from "zustand/shallow";
import type {
	WorkbenchBorders,
	WorkbenchLayout,
	WorkbenchLayoutNode,
	WorkbenchMoveTarget,
	WorkbenchPanelConfigAny,
	WorkbenchPanelId,
	WorkbenchPanelOptions,
	WorkbenchPanelParams,
	WorkbenchPanelRecord,
	WorkbenchPanelSlot,
	WorkbenchPanelStatus,
	WorkbenchPanelType,
	WorkbenchSide,
	WorkbenchSlice,
	WorkbenchSlotRect,
	WorkbenchSnapshot,
	WorkbenchStack,
	WorkbenchTabset,
} from "../workbench.types";
import { WORKBENCH_SIDES } from "../workbench.types";
import {
	createNodeId,
	emptyTabset,
	findTabset,
	findTabsetOf,
	flatten,
	joinTabset,
	movePanelInTree,
	parseWorkbenchSnapshot,
	removePanel,
	resizeChildren,
	resolvePinDrop,
	stripFromBorders,
	updateTabset,
	withAllBorders,
} from "./workbench-layout.tree";

/** A per-instance capability flag key. */
type WorkbenchPanelFlag = "canClose" | "canDrag" | "canMaximize" | "canRename";

/** The user's current panel focus plus recent panel focus history. */
interface WorkbenchSelectionState {
	panel: WorkbenchPanelId | undefined;
	history: WorkbenchPanelId[];
}

/** Layout state fields owned by each workbench instance. */
interface WorkbenchLayoutSliceFields {
	/** Unique identity for this workbench instance. */
	id: string;

	/** True once loadLayout has produced a usable arrangement. */
	hydrated: boolean;

	/** Structural edits (move/split/pin/reset) are rejected when true. */
	readOnly: boolean;

	/** Mirrors the shell's mobile breakpoint so visibility derives here. */
	isMobileLayout: boolean;

	/** Every open panel instance. Closing one deletes its record. */
	panels: Record<WorkbenchPanelId, WorkbenchPanelRecord>;

	/** The dock layout tree. */
	tree: WorkbenchLayoutNode;

	/** The four border edges. */
	borders: WorkbenchBorders;

	/** The panel the user last interacted with, plus recent selection history. */
	selection: WorkbenchSelectionState;

	/**
	 * The dock the user last worked in, and where a new panel lands. Tracked
	 * rather than derived from the selection: selecting a border panel — a file
	 * explorer, say — must not make the main area forget where you were.
	 * Session state, so it is not persisted.
	 */
	lastTabsetId: string | undefined;

	/** The dock currently maximized over the stage, if any. */
	maximizedTabsetId: string | undefined;

	/** The single panel shown by the mobile stack. Not persisted. */
	mobileActivePanelId: WorkbenchPanelId | undefined;

	/** Per-panel scratch values read/written through the panel api. Never persisted. */
	values: Record<WorkbenchPanelId, unknown>;

	/** Panel blueprints keyed by type, registered by the shell. */
	components: Record<WorkbenchPanelType, WorkbenchPanelConfigAny>;

	/** Body load status per panel type (shared by that type's instances). */
	componentStatuses: Record<WorkbenchPanelType, WorkbenchPanelStatus>;

	/** The panel currently being dragged, if any. Ephemeral. */
	draggingPanelId: WorkbenchPanelId | undefined;

	/** The panel whose name is being edited inline, if any. Ephemeral. */
	editingPanelId: WorkbenchPanelId | undefined;

	/** Measured slot geometry, relative to the workbench root. Ephemeral. */
	slotRects: Record<string, WorkbenchSlotRect>;

	/** Derived: flatten(tree), in visual order. */
	tabsets: WorkbenchTabset[];

	/** Derived: docks then populated borders — every place a panel can live. */
	stacks: WorkbenchStack[];

	/** Derived: every docked (open) panel id, in stack order. */
	openPanelIds: WorkbenchPanelId[];

	/** Derived: panels actually on screen right now. */
	visiblePanelIds: WorkbenchPanelId[];

	/** Derived: which slot each open panel is drawn over. */
	panelSlots: Record<WorkbenchPanelId, WorkbenchPanelSlot>;

	/** Optional domain store attached by a domain workbench (e.g. database). */
	domainStore: StoreApi<object> | undefined;
}

/** Layout actions exposed under the store's `actions` namespace. */
export interface WorkbenchLayoutActions {
	/**
	 * Register the components map. Blueprints should be module-scope constants
	 * so re-registration is an identity no-op.
	 */
	registerComponents: (
		components: Record<WorkbenchPanelType, WorkbenchPanelConfigAny>,
	) => void;

	/** Mark a panel type's body as resolved. */
	markComponentReady: (type: WorkbenchPanelType) => void;

	/** Mark a panel type's body as failed. */
	markComponentError: (type: WorkbenchPanelType) => void;

	/** Attach a domain store so domain hooks can reach it without a context. */
	attachDomainStore: (store: StoreApi<object>) => void;

	/** Register the root element slot rects are measured against. */
	registerRootElement: (el: HTMLElement | null) => void;

	/** Register (or unregister with null) a slot element by key. */
	registerSlotElement: (key: string, el: HTMLElement | null) => void;

	/** Re-measure every registered slot, committing only real changes. */
	measureSlots: () => void;

	/**
	 * Restore this workbench's cached snapshot, falling back to the supplied
	 * default when nothing usable is cached. Read once per layout identity.
	 *
	 * @param layout - Default layout used when the cache is empty or unusable.
	 * @param opts - The readOnly flag.
	 */
	loadLayout: (
		layout: WorkbenchLayout,
		opts?: {
			readOnly?: boolean;
		},
	) => void;

	/** Back to the default layout; overwrites the cache immediately. */
	resetLayout: () => void;

	/** Flush any deferred cache write (resize end, unload). */
	persistNow: () => void;

	/**
	 * Reveal an instance of `type` matching `config` (blueprint `matches`,
	 * shallow-equal default), restoring a closed match or spawning a new
	 * instance when none exists.
	 *
	 * `matches` does **not** imply uniqueness — `spawnPanel` bypasses it — so
	 * several matches can coexist. They are preferred in order of how little
	 * they disturb the layout: one already on screen, then one open but hidden
	 * (revealing it is a tab switch), then a closed record (which has to be
	 * re-docked, and reads to the user as a new panel appearing).
	 *
	 * @return The revealed or created panel id.
	 */
	selectPanel: (
		type: WorkbenchPanelType,
		config?: WorkbenchPanelParams,
		opts?: WorkbenchPanelOptions,
	) => WorkbenchPanelId;

	/**
	 * Create a fresh instance of a blueprint. `opts.target` supports "join"
	 * (a specific dock) and "border"; other kinds fall back to the main dock.
	 *
	 * @return The new panel id.
	 */
	spawnPanel: (
		type: WorkbenchPanelType,
		opts?: WorkbenchPanelOptions,
	) => WorkbenchPanelId;

	/**
	 * Close a panel, honouring its canClose flag. The instance is **deleted** —
	 * there is no reopen history, so `panels` always means "what is open".
	 */
	closePanel: (pid: WorkbenchPanelId) => void;

	/**
	 * Rename a panel. Programmatic — the `canRename` flag only gates the
	 * user-facing rename affordances.
	 */
	renamePanel: (pid: WorkbenchPanelId, name: string) => void;

	/** Merge a type/name/config/capability patch into a panel's record. */
	updatePanel: (
		pid: WorkbenchPanelId,
		patch: Partial<Omit<WorkbenchPanelRecord, "id">>,
	) => void;

	/** Write a panel's scratch value. */
	setPanelValue: (
		pid: WorkbenchPanelId,
		next: unknown | ((prev: unknown) => unknown),
	) => void;

	/** Pin or unpin a panel, reordering it within its strip. */
	setPinned: (pid: WorkbenchPanelId, pinned: boolean) => void;

	/** Mark the panel the user last interacted with. */
	setSelectedPanel: (pid: WorkbenchPanelId | undefined) => void;

	/** Show a panel where it lives — a dock tab or a border. */
	activatePanel: (
		stack: Pick<WorkbenchStack, "kind" | "id">,
		pid: WorkbenchPanelId,
	) => void;

	/** Move a panel to a dock or border target, resolving pin boundaries. */
	movePanel: (pid: WorkbenchPanelId, target: WorkbenchMoveTarget) => void;

	/** Two viewports onto the active panel inside one dock, or back to one. */
	splitInTab: (tabsetId: string, dir?: "row" | "col" | "off") => void;

	/**
	 * Maximize a dock over the stage, or restore whatever is maximized. With
	 * no argument it takes the dock last worked in.
	 */
	toggleMaximize: (tabsetId?: string) => void;

	/** Rail icon behaviour: open the panel, or collapse it if showing. */
	toggleBorderPanel: (side: WorkbenchSide, pid: WorkbenchPanelId) => void;

	/** Collapse a border back to its rail. */
	collapseBorder: (side: WorkbenchSide) => void;

	/** Show one panel in the mobile stack. */
	setMobileActivePanel: (pid: WorkbenchPanelId) => void;

	/** Mirror the shell's mobile breakpoint into the store. */
	setMobileLayout: (isMobile: boolean) => void;

	/** Resize two adjacent children of a container (flex weights). */
	resizeTreeChildren: (
		containerId: string,
		index: number,
		a: number,
		b: number,
	) => void;

	/** Resize a dock's split-in-tab ratio. */
	resizeTabSplit: (tabsetId: string, ratio: number) => void;

	/** Resize an open border (px). */
	resizeBorder: (side: WorkbenchSide, size: number) => void;

	/** Set the panel whose name is being edited inline. */
	setEditingPanel: (pid: WorkbenchPanelId | undefined) => void;

	/** Mark the panel currently being dragged, if any. */
	setDragging: (pid: WorkbenchPanelId | undefined) => void;

	/** Whether a panel may be closed (instance override → blueprint → true). */
	canClose: (pid: WorkbenchPanelId | null | undefined) => boolean;

	/** Whether a panel may be dragged. */
	canDrag: (pid: WorkbenchPanelId | null | undefined) => boolean;

	/** Whether a panel may be maximized. */
	canMaximize: (pid: WorkbenchPanelId | null | undefined) => boolean;

	/** Whether the user may rename a panel. */
	canRename: (pid: WorkbenchPanelId | null | undefined) => boolean;

	/**
	 * Whether a tab offers the in-place "Split Tab" viewports. Opt-in, unlike
	 * the other flags: instance override → blueprint → false.
	 */
	canSplitTab: (pid: WorkbenchPanelId | null | undefined) => boolean;

	/** One panel's record, or undefined when no such instance exists. */
	getPanel: (
		pid: WorkbenchPanelId | null | undefined,
	) => WorkbenchPanelRecord | undefined;

	/**
	 * Every panel record matching a predicate — open, closed, or docked in a
	 * border. Reads live state, so callers in imperative handlers stay correct
	 * without subscribing to the whole `panels` map.
	 */
	findPanels: (
		predicate: (record: WorkbenchPanelRecord) => boolean,
	) => WorkbenchPanelRecord[];
}

/** The layout slice: fields plus its `actions` contribution. */
export interface WorkbenchLayoutSliceState extends WorkbenchLayoutSliceFields {
	actions: WorkbenchLayoutActions;
}

/** Default identity for selectPanel(): same config, shallowly. */
const shallowEqual = (
	a: WorkbenchPanelParams,
	b: WorkbenchPanelParams,
): boolean => {
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	return keysA.length === keysB.length && keysA.every((k) => a[k] === b[k]);
};

const capitalize = (value: string): string =>
	value.length ? value[0].toUpperCase() + value.slice(1) : value;

const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const nextSelection = (
	selection: WorkbenchSelectionState,
	openPanelIds: WorkbenchPanelId[],
): WorkbenchSelectionState => {
	const open = new Set(openPanelIds);
	const history: WorkbenchPanelId[] = [];

	for (const pid of selection.history) {
		if (!open.has(pid)) {
			continue;
		}
		const existing = history.indexOf(pid);
		if (existing !== -1) {
			history.splice(existing, 1);
		}
		history.push(pid);
	}

	const panel =
		selection.panel && open.has(selection.panel)
			? selection.panel
			: undefined;
	if (panel) {
		const existing = history.indexOf(panel);
		if (existing !== -1) {
			history.splice(existing, 1);
		}
		history.push(panel);
	}

	return {
		panel,
		history,
	};
};

/** State the derived fields are computed from. */
type DeriveInput = Pick<
	WorkbenchLayoutSliceFields,
	| "tree"
	| "borders"
	| "isMobileLayout"
	| "mobileActivePanelId"
	| "maximizedTabsetId"
>;

/** Derived fields recomputed transactionally on every layout commit. */
type Derived = Pick<
	WorkbenchLayoutSliceFields,
	| "tabsets"
	| "stacks"
	| "openPanelIds"
	| "visiblePanelIds"
	| "panelSlots"
	| "mobileActivePanelId"
	| "maximizedTabsetId"
>;

const derive = (state: DeriveInput): Derived => {
	const tabsets = flatten(state.tree);
	const stacks: WorkbenchStack[] = [
		...tabsets.map(
			(tabset, index): WorkbenchStack => ({
				key: tabset.id,
				kind: "tabset",
				id: tabset.id,
				label: `Dock ${index + 1}`,
				panelIds: tabset.panelIds,
				activeId: tabset.activeId,
			}),
		),
		...WORKBENCH_SIDES.filter(
			(side) => state.borders[side].panelIds.length,
		).map(
			(side): WorkbenchStack => ({
				key: `border:${side}`,
				kind: "border",
				id: side,
				label: `${capitalize(side)} border`,
				panelIds: state.borders[side].panelIds,
				activeId: state.borders[side].activeId,
			}),
		),
	];
	const openPanelIds = stacks.flatMap((stack) => stack.panelIds);

	const mobileActivePanelId =
		state.mobileActivePanelId &&
		openPanelIds.includes(state.mobileActivePanelId)
			? state.mobileActivePanelId
			: openPanelIds[0];

	const visiblePanelIds = state.isMobileLayout
		? mobileActivePanelId
			? [mobileActivePanelId]
			: []
		: [
				...tabsets.map((tabset) => tabset.activeId),
				...WORKBENCH_SIDES.map((side) => state.borders[side].activeId),
			].filter((pid): pid is WorkbenchPanelId => Boolean(pid));

	const panelSlots: Record<WorkbenchPanelId, WorkbenchPanelSlot> = {};
	if (state.isMobileLayout) {
		for (const pid of openPanelIds) {
			panelSlots[pid] = {
				slot: "mobile",
				active: pid === mobileActivePanelId,
			};
		}
	} else {
		for (const tabset of tabsets) {
			for (const pid of tabset.panelIds) {
				panelSlots[pid] = {
					slot: tabset.id,
					active: tabset.activeId === pid,
				};
			}
		}
		for (const side of WORKBENCH_SIDES) {
			for (const pid of state.borders[side].panelIds) {
				panelSlots[pid] = {
					slot: `border:${side}`,
					active: state.borders[side].activeId === pid,
				};
			}
		}
	}

	// a maximized dock that no longer exists must not black-hole the stage
	const maximizedTabsetId =
		state.maximizedTabsetId &&
		findTabset(state.tree, state.maximizedTabsetId)
			? state.maximizedTabsetId
			: undefined;

	return {
		tabsets,
		stacks,
		openPanelIds,
		visiblePanelIds,
		panelSlots,
		mobileActivePanelId,
		maximizedTabsetId,
	};
};

const slotRectsEqual = (a: WorkbenchSlotRect, b: WorkbenchSlotRect): boolean =>
	a.left === b.left &&
	a.top === b.top &&
	a.width === b.width &&
	a.height === b.height &&
	a.radius === b.radius;

/**
 * Creates the dock layout slice for one workbench.
 *
 * @name createWorkbenchLayoutSlice
 * @param id - Unique workbench ID used to isolate the cache.
 * @return Zustand state creator for the workbench layout slice.
 */
export const createWorkbenchLayoutSlice = (
	id: string,
): WorkbenchSlice<WorkbenchLayoutSliceState> => {
	// `id` never changes for a store instance, so the key can be built once.
	// resolved from the layout's version the first time one is loaded, so a
	// workbench that bumps its version simply stops seeing the old entries
	let cacheKey = "";

	// Closure-scoped, never in state: none of these should notify subscribers.
	let defaultLayout: WorkbenchLayout | null = null;
	let rootElement: HTMLElement | null = null;
	const slotElements = new Map<string, HTMLElement>();
	let persistTimer: ReturnType<typeof setTimeout> | null = null;
	// Watches every registered slot, so geometry that moves without a layout
	// commit (a taller tab strip, a webfont landing) still re-measures.
	let slotObserver: ResizeObserver | null = null;
	let measureFrame = 0;

	return (set, get) => {
		const buildSnapshot = (): WorkbenchSnapshot => {
			const state = get().layout;
			return {
				tree: state.tree,
				borders: state.borders,
				panels: state.panels,
				selectedPanelId: state.selection.panel,
				maximizedTabsetId: state.maximizedTabsetId,
			};
		};

		const persistNow = (): void => {
			if (persistTimer) {
				clearTimeout(persistTimer);
				persistTimer = null;
			}
			if (!get().layout.hydrated) {
				return;
			}
			try {
				localStorage.setItem(cacheKey, JSON.stringify(buildSnapshot()));
			} catch (e) {
				console.error(e);
			}
		};

		const schedulePersist = (): void => {
			if (persistTimer) {
				clearTimeout(persistTimer);
			}
			persistTimer = setTimeout(persistNow, 300);
		};

		/**
		 * Coalesce slot re-measures to one per frame. Self-terminating:
		 * `measureSlots` returns without a `set` when nothing moved, so an
		 * observer callback it provokes cannot start a loop.
		 */
		const scheduleMeasure = (): void => {
			if (measureFrame) {
				return;
			}
			measureFrame = requestAnimationFrame(() => {
				measureFrame = 0;
				get().layout.actions.measureSlots();
			});
		};

		const observeSlot = (el: HTMLElement): void => {
			if (typeof ResizeObserver === "undefined") {
				return;
			}
			if (!slotObserver) {
				slotObserver = new ResizeObserver(scheduleMeasure);
			}
			slotObserver.observe(el);
		};

		/**
		 * The single write path: applies a patch, recomputes derived fields,
		 * and persists.
		 */
		const commit = (
			mutate: (
				state: WorkbenchLayoutSliceState,
			) => Partial<WorkbenchLayoutSliceFields>,
			opts: { persist?: "now" | "defer" | "skip" } = {},
		): void => {
			set((root) => {
				const state = root.layout;
				const patch = mutate(state);
				// derived fields keep their identities unless a layout input
				// actually changed, so narrow subscribers can bail cheaply
				const needsDerive =
					"tree" in patch ||
					"borders" in patch ||
					"isMobileLayout" in patch ||
					"mobileActivePanelId" in patch ||
					"maximizedTabsetId" in patch;
				const derived = needsDerive
					? derive({
							tree: patch.tree ?? state.tree,
							borders: patch.borders ?? state.borders,
							isMobileLayout:
								patch.isMobileLayout ?? state.isMobileLayout,
							mobileActivePanelId:
								"mobileActivePanelId" in patch
									? patch.mobileActivePanelId
									: state.mobileActivePanelId,
							maximizedTabsetId:
								"maximizedTabsetId" in patch
									? patch.maximizedTabsetId
									: state.maximizedTabsetId,
						})
					: {};
				// A dock becomes "the one last worked in" when the selection
				// lands inside it. Derived here rather than at each call site:
				// every path that moves the selection comes through this write,
				// and a selection that lands in a border holds no dock, so it
				// correctly leaves the answer alone.
				const openPanelIds =
					(derived as Partial<Derived>).openPanelIds ??
					state.openPanelIds;
				const selection =
					"selection" in patch || needsDerive
						? nextSelection(
								patch.selection ?? state.selection,
								openPanelIds ?? [],
							)
						: state.selection;
				const selected = selection.panel;
				const holding = selected
					? findTabsetOf(patch.tree ?? state.tree, selected)
					: null;
				return {
					layout: {
						...state,
						...patch,
						...derived,
						selection,
						lastTabsetId: holding?.id ?? state.lastTabsetId,
					},
				};
			});
			const mode = opts.persist ?? "now";
			if (mode === "now") {
				persistNow();
			} else if (mode === "defer") {
				schedulePersist();
			}
		};

		const flagOf = (
			pid: WorkbenchPanelId | null | undefined,
			key: WorkbenchPanelFlag,
		): boolean => {
			if (!pid) {
				return false;
			}
			const state = get().layout;
			const record = state.panels[pid];
			if (!record) {
				return false;
			}
			const instance = record[key];
			if (instance !== undefined) {
				return instance;
			}
			return state.components[record.type]?.[key] !== false;
		};

		/** Where new panels go: the dock holding the selection, else the first. */
		const mainTabsetId = (
			state: WorkbenchLayoutSliceState,
		): string | undefined => {
			const all = flatten(state.tree);
			const selected = state.selection.panel;
			// the last dock worked in, then whichever holds the selection (a
			// border panel holds none), then the first
			const last = state.lastTabsetId
				? all.find((tabset) => tabset.id === state.lastTabsetId)
				: undefined;
			const holding = selected
				? all.find((tabset) => tabset.panelIds.includes(selected))
				: undefined;
			return (last ?? holding ?? all[0])?.id;
		};

		/**
		 * Replace the whole arrangement. A panel whose component is not
		 * registered stays as a placeholder — the body renders "no component
		 * registered" rather than the instance being dropped.
		 */
		const applySnapshot = (snapshot: WorkbenchSnapshot): void => {
			const borders = withAllBorders(snapshot.borders);
			const openIds = new Set<WorkbenchPanelId>([
				...flatten(snapshot.tree).flatMap((tabset) => tabset.panelIds),
				...WORKBENCH_SIDES.flatMap((side) => borders[side].panelIds),
			]);

			// `panels` holds exactly the open instances. A cache written while
			// closed panels were still tracked carries records that sit in no
			// tabset and no border, and those would otherwise linger forever —
			// invisible, but still matching a `selectPanel` lookup.
			const panels = Object.fromEntries(
				Object.entries(snapshot.panels).filter(([pid]) =>
					openIds.has(pid),
				),
			);
			const selectedPanelId =
				snapshot.selectedPanelId &&
				openIds.has(snapshot.selectedPanelId)
					? snapshot.selectedPanelId
					: undefined;

			commit(() => ({
				tree: snapshot.tree,
				panels: panels,
				borders: borders,
				selection: {
					panel: selectedPanelId,
					history: selectedPanelId ? [selectedPanelId] : [],
				},
				maximizedTabsetId: snapshot.maximizedTabsetId,
			}));
		};

		const initialDerived = derive({
			tree: emptyTabset(),
			borders: withAllBorders(),
			isMobileLayout: false,
			mobileActivePanelId: undefined,
			maximizedTabsetId: undefined,
		});

		return {
			id: id,
			hydrated: false,
			readOnly: false,
			isMobileLayout: false,
			panels: {},
			tree: emptyTabset(),
			borders: withAllBorders(),
			selection: { panel: undefined, history: [] },
			lastTabsetId: undefined,
			values: {},
			components: {},
			componentStatuses: {},
			draggingPanelId: undefined,
			editingPanelId: undefined,
			slotRects: {},
			domainStore: undefined,
			...initialDerived,

			actions: {
				registerComponents: (components) => {
					if (get().layout.components === components) {
						return;
					}
					set((root) => ({ layout: { ...root.layout, components } }));
				},
				markComponentReady: (type) => {
					if (get().layout.componentStatuses[type] === "ready") {
						return;
					}
					set((root) => ({
						layout: {
							...root.layout,
							componentStatuses: {
								...root.layout.componentStatuses,
								[type]: "ready",
							},
						},
					}));
				},
				markComponentError: (type) => {
					if (get().layout.componentStatuses[type] === "error") {
						return;
					}
					set((root) => ({
						layout: {
							...root.layout,
							componentStatuses: {
								...root.layout.componentStatuses,
								[type]: "error",
							},
						},
					}));
				},
				attachDomainStore: (store) => {
					if (get().layout.domainStore === store) {
						return;
					}
					set((root) => ({
						layout: { ...root.layout, domainStore: store },
					}));
				},
				registerRootElement: (el) => {
					rootElement = el;
					if (!el) {
						// the shell clears the root on unmount, which is the
						// only teardown hook the slice gets
						slotObserver?.disconnect();
						slotObserver = null;
						if (measureFrame) {
							cancelAnimationFrame(measureFrame);
							measureFrame = 0;
						}
						return;
					}
					// re-arm after a remount: slot refs that survived it will
					// not fire again, so they would go unobserved
					for (const slot of slotElements.values()) {
						observeSlot(slot);
					}
				},
				registerSlotElement: (key, el) => {
					const prev = slotElements.get(key);
					if (prev === el) {
						return;
					}
					if (prev) {
						slotObserver?.unobserve(prev);
					}
					if (!el) {
						slotElements.delete(key);
						return;
					}
					slotElements.set(key, el);
					observeSlot(el);
				},
				measureSlots: () => {
					if (!rootElement || !rootElement.isConnected) {
						return;
					}
					const base = rootElement.getBoundingClientRect();
					const prev = get().layout.slotRects;
					const next: Record<string, WorkbenchSlotRect> = {};
					let changed = false;
					for (const [key, el] of slotElements) {
						if (!el.isConnected) {
							// a detached slot is gone for good — drop it rather
							// than retain the node until the key is re-registered
							slotObserver?.unobserve(el);
							slotElements.delete(key);
							continue;
						}
						const bounds = el.getBoundingClientRect();
						// Snap to whole pixels. Flex weights land slots on
						// fractional offsets, and a body drawn at one renders
						// every 1px rule inside it on a half pixel. Both edges
						// are rounded from the same origin, so slots that abut
						// still meet exactly.
						const left = Math.round(bounds.left - base.left);
						const top = Math.round(bounds.top - base.top);
						const rect: WorkbenchSlotRect = {
							left,
							top,
							width: Math.round(bounds.right - base.left) - left,
							height: Math.round(bounds.bottom - base.top) - top,
							// declared by the slot, read here so the body's
							// corners follow it without a second channel
							radius: el.dataset.radius ?? "0",
						};
						const old = prev[key];
						if (old && slotRectsEqual(old, rect)) {
							next[key] = old;
						} else {
							next[key] = rect;
							changed = true;
						}
					}
					// a key that vanished is a change too — counts alone would
					// miss a same-size swap, which is exactly what a split does
					if (!changed) {
						for (const key of Object.keys(prev)) {
							if (!(key in next)) {
								changed = true;
								break;
							}
						}
					}
					if (!changed) {
						return;
					}
					set((root) => ({
						layout: { ...root.layout, slotRects: next },
					}));
				},

				loadLayout: (layout, opts = {}) => {
					cacheKey = `smss-workbench--layout--${id}--${layout.version}`;
					defaultLayout = deepCopy(layout);
					set((root) => ({
						layout: {
							...root.layout,
							readOnly: opts.readOnly ?? false,
						},
					}));

					let cached: WorkbenchSnapshot | null = null;
					try {
						const item = localStorage.getItem(cacheKey);
						if (item) {
							cached = parseWorkbenchSnapshot(JSON.parse(item));
						}
					} catch (e) {
						console.error(e);
					}

					applySnapshot(cached ?? deepCopy(layout));
					set((root) => ({
						layout: { ...root.layout, hydrated: true },
					}));
					persistNow();
				},
				resetLayout: () => {
					if (get().layout.readOnly || !defaultLayout) {
						return;
					}
					applySnapshot(deepCopy(defaultLayout));
				},
				persistNow: persistNow,

				selectPanel: (type, config = {}, opts = {}) => {
					const state = get().layout;
					const same =
						state.components[type]?.matches ?? shallowEqual;
					const candidates = Object.values(state.panels).filter(
						(record) =>
							record.type === type &&
							same(record.config ?? {}, config),
					);
					// `matches` does not guarantee uniqueness — `spawnPanel`
					// bypasses it, so dragging a file out of the explorer
					// leaves several views of it. Prefer one already on screen;
					// revealing any other is a tab switch either way.
					const existing =
						candidates.find((record) =>
							state.visiblePanelIds.includes(record.id),
						) ?? candidates[0];

					if (!existing) {
						return get().layout.actions.spawnPanel(type, {
							...opts,
							config,
						});
					}

					const inTabset = findTabsetOf(state.tree, existing.id);
					if (inTabset) {
						commit((s) => ({
							tree:
								inTabset.activeId === existing.id
									? s.tree
									: updateTabset(
											s.tree,
											inTabset.id,
											(tabset) => ({
												...tabset,
												activeId: existing.id,
											}),
										),
							maximizedTabsetId:
								s.maximizedTabsetId &&
								s.maximizedTabsetId !== inTabset.id
									? undefined
									: s.maximizedTabsetId,
							selection: {
								...s.selection,
								panel: existing.id,
							},
							mobileActivePanelId: existing.id,
						}));
						return existing.id;
					}

					const side = WORKBENCH_SIDES.find((candidate) =>
						state.borders[candidate].panelIds.includes(existing.id),
					);
					if (side) {
						// reveal in place — never collapse an already-open border
						commit((s) => ({
							borders: {
								...s.borders,
								[side]: {
									...s.borders[side],
									activeId: existing.id,
								},
							},
							selection: {
								...s.selection,
								panel: existing.id,
							},
							mobileActivePanelId: existing.id,
						}));
						return existing.id;
					}

					// Belt and braces: a record in `panels` but in no stack
					// should be impossible now that closing deletes it, but
					// dock it rather than hand back an id nothing can show.
					commit((s) => {
						const host = mainTabsetId(s);
						return {
							tree: host
								? joinTabset(s.tree, host, existing.id)
								: s.tree,
							selection: {
								...s.selection,
								panel: existing.id,
							},
							mobileActivePanelId: existing.id,
						};
					});
					return existing.id;
				},
				spawnPanel: (type, opts = {}) => {
					const { target, name, config, ...flags } = opts;
					const pid = createNodeId("p");
					const record: WorkbenchPanelRecord = {
						id: pid,
						type: type,
						name:
							name ??
							get().layout.components[type]?.name ??
							"Untitled",
						...(config !== undefined ? { config } : {}),
						...flags,
					};

					commit((s) => {
						const panels = { ...s.panels, [pid]: record };
						if (target?.kind === "border") {
							const border = s.borders[target.side];
							const ids = [...border.panelIds];
							ids.splice(
								target.index == null
									? ids.length
									: Math.max(
											0,
											Math.min(target.index, ids.length),
										),
								0,
								pid,
							);
							return {
								panels,
								borders: {
									...s.borders,
									[target.side]: {
										...border,
										panelIds: ids,
										activeId: pid,
									},
								},
								selection: {
									...s.selection,
									panel: pid,
								},
								mobileActivePanelId: pid,
							};
						}
						const requested =
							target?.kind === "join"
								? target.tabsetId
								: undefined;
						const host =
							requested && findTabset(s.tree, requested)
								? requested
								: mainTabsetId(s);
						return {
							panels,
							tree: host ? joinTabset(s.tree, host, pid) : s.tree,
							selection: {
								...s.selection,
								panel: pid,
							},
							mobileActivePanelId: pid,
						};
					});
					return pid;
				},
				closePanel: (pid) => {
					if (!flagOf(pid, "canClose")) {
						return;
					}
					commit((s) => {
						// the instance is gone, so its record and its scratch
						// value go with it — ids are minted and never reused,
						// so anything left keyed by this one is dead weight
						const panels = { ...s.panels };
						delete panels[pid];
						const values = { ...s.values };
						delete values[pid];

						return {
							tree: removePanel(s.tree, pid) ?? emptyTabset(),
							borders: stripFromBorders(s.borders, pid),
							panels: panels,
							values: values,
							selection: {
								...s.selection,
								panel:
									s.selection.panel === pid
										? undefined
										: s.selection.panel,
							},
							editingPanelId:
								s.editingPanelId === pid
									? undefined
									: s.editingPanelId,
						};
					});
				},
				renamePanel: (pid, name) => {
					const clean = name.trim();
					if (!clean) {
						return;
					}
					commit((s) => {
						const record = s.panels[pid];
						if (!record || record.name === clean) {
							return {};
						}
						return {
							panels: {
								...s.panels,
								[pid]: { ...record, name: clean },
							},
						};
					});
				},
				updatePanel: (pid, patch) => {
					commit((s) => {
						const record = s.panels[pid];
						if (!record) {
							return {};
						}
						return {
							panels: {
								...s.panels,
								[pid]: {
									...record,
									...patch,
									config: patch.config
										? {
												...record.config,
												...patch.config,
											}
										: record.config,
									id: record.id,
									type: patch.type ?? record.type,
								},
							},
						};
					});
				},
				setPanelValue: (pid, next) => {
					const prev = get().layout.values[pid];
					const resolved =
						typeof next === "function"
							? (next as (prev: unknown) => unknown)(prev)
							: next;
					if (shallow(prev, resolved)) {
						return;
					}
					set((root) => ({
						layout: {
							...root.layout,
							values: {
								...root.layout.values,
								[pid]: resolved,
							},
						},
					}));
				},
				setPinned: (pid, pinned) => {
					if (get().layout.readOnly) {
						return;
					}
					commit((s) => {
						const record = s.panels[pid];
						if (!record) {
							return {};
						}
						const host = findTabsetOf(s.tree, pid);
						const panels = {
							...s.panels,
							[pid]: { ...record, pinned },
						};
						if (!host) {
							return { panels };
						}
						return {
							panels,
							tree: updateTabset(s.tree, host.id, (tabset) => {
								const rest = tabset.panelIds.filter(
									(x) => x !== pid,
								);
								const pinnedCount = rest.filter(
									(x) => panels[x]?.pinned,
								).length;
								const at = pinned ? 0 : pinnedCount;
								const next = [...rest];
								next.splice(at, 0, pid);
								return { ...tabset, panelIds: next };
							}),
						};
					});
				},
				setSelectedPanel: (pid) => {
					if (get().layout.selection.panel === pid) {
						return;
					}
					commit(
						(s) => ({
							selection: { ...s.selection, panel: pid },
						}),
						{
							persist: "defer",
						},
					);
				},
				activatePanel: (stack, pid) => {
					commit((s) => {
						if (stack.kind === "tabset") {
							return {
								tree: updateTabset(
									s.tree,
									stack.id,
									(tabset) => ({
										...tabset,
										activeId: pid,
									}),
								),
								selection: {
									...s.selection,
									panel: pid,
								},
								mobileActivePanelId: pid,
							};
						}
						const side = stack.id as WorkbenchSide;
						return {
							borders: {
								...s.borders,
								[side]: {
									...s.borders[side],
									activeId: pid,
								},
							},
							selection: {
								...s.selection,
								panel: pid,
							},
							mobileActivePanelId: pid,
						};
					});
				},
				movePanel: (pid, target) => {
					if (get().layout.readOnly || !flagOf(pid, "canDrag")) {
						return;
					}
					if (target.kind === "border") {
						commit((s) => {
							const current = s.borders[target.side];
							const wasHere = current.panelIds.includes(pid);

							// the icon still holds its slot mid-drag, so slots
							// after it shift left
							let index = target.index;
							if (
								index != null &&
								wasHere &&
								current.panelIds.indexOf(pid) < index
							) {
								index -= 1;
							}

							const stripped = stripFromBorders(s.borders, pid);
							const border = stripped[target.side];
							const ids = [...border.panelIds];
							ids.splice(
								index == null
									? ids.length
									: Math.max(0, Math.min(index, ids.length)),
								0,
								pid,
							);

							// a panel arriving from elsewhere opens; a reorder
							// leaves the border as it was
							return {
								borders: {
									...stripped,
									[target.side]: {
										...border,
										panelIds: ids,
										activeId: wasHere
											? current.activeId
											: pid,
									},
								},
								tree: removePanel(s.tree, pid) ?? emptyTabset(),
							};
						});
						return;
					}

					commit((s) => {
						let move: WorkbenchMoveTarget = target;
						let panels = s.panels;
						const dest =
							target.kind === "join"
								? findTabset(s.tree, target.tabsetId)
								: null;

						if (target.kind === "join" && dest) {
							const isPinned = (
								candidate: WorkbenchPanelId,
							): boolean => Boolean(s.panels[candidate]?.pinned);
							const ids = dest.panelIds.filter((x) => x !== pid);
							const src = findTabsetOf(s.tree, pid);

							// post-removal coordinates, matching movePanelInTree
							let index = target.index;
							if (
								index != null &&
								src?.id === dest.id &&
								src.panelIds.indexOf(pid) < index
							) {
								index -= 1;
							}

							const landing = resolvePinDrop(
								ids,
								index ??
									(isPinned(pid)
										? ids.filter(isPinned).length
										: ids.length),
								isPinned(pid),
								isPinned,
							);
							move = {
								...target,
								index: landing.index,
								resolved: true,
							};

							const record = s.panels[pid];
							if (record && landing.pinned !== isPinned(pid)) {
								panels = {
									...s.panels,
									[pid]: {
										...record,
										pinned: landing.pinned,
									},
								};
							}
						}

						return {
							panels,
							borders: stripFromBorders(s.borders, pid),
							tree: movePanelInTree(s.tree, pid, move),
						};
					});
				},
				splitInTab: (tabsetId, dir = "row") => {
					if (get().layout.readOnly) {
						return;
					}
					commit((s) => ({
						tree: updateTabset(s.tree, tabsetId, (tabset) =>
							dir === "off"
								? { ...tabset, split: undefined }
								: {
										...tabset,
										split: {
											dir,
											ratio: tabset.split?.ratio ?? 0.5,
										},
									},
						),
					}));
				},
				toggleMaximize: (tabsetId) => {
					commit((s) => {
						// anything maximized restores: the others are behind a
						// backdrop, so there is no second dock to switch to
						if (s.maximizedTabsetId) {
							return { maximizedTabsetId: undefined };
						}
						const id = tabsetId ?? mainTabsetId(s);
						const tabset = id ? findTabset(s.tree, id) : null;
						if (!tabset || tabset.enableMaximize === false) {
							return {};
						}
						if (
							tabset.activeId &&
							!flagOf(tabset.activeId, "canMaximize")
						) {
							return {};
						}
						return { maximizedTabsetId: tabset.id };
					});
				},
				toggleBorderPanel: (side, pid) => {
					commit((s) => ({
						borders: {
							...s.borders,
							[side]: {
								...s.borders[side],
								activeId:
									s.borders[side].activeId === pid
										? null
										: pid,
							},
						},
						selection: { ...s.selection, panel: pid },
					}));
				},
				collapseBorder: (side) => {
					commit((s) => ({
						borders: {
							...s.borders,
							[side]: { ...s.borders[side], activeId: null },
						},
					}));
				},
				setMobileActivePanel: (pid) => {
					commit(() => ({ mobileActivePanelId: pid }), {
						persist: "skip",
					});
				},
				setMobileLayout: (isMobile) => {
					if (get().layout.isMobileLayout === isMobile) {
						return;
					}
					commit(() => ({ isMobileLayout: isMobile }), {
						persist: "skip",
					});
				},
				resizeTreeChildren: (containerId, index, a, b) => {
					commit(
						(s) => ({
							tree: resizeChildren(
								s.tree,
								containerId,
								index,
								a,
								b,
							),
						}),
						{ persist: "defer" },
					);
				},
				resizeTabSplit: (tabsetId, ratio) => {
					commit(
						(s) => ({
							tree: updateTabset(s.tree, tabsetId, (tabset) =>
								tabset.split
									? {
											...tabset,
											split: {
												...tabset.split,
												ratio,
											},
										}
									: tabset,
							),
						}),
						{ persist: "defer" },
					);
				},
				resizeBorder: (side, size) => {
					commit(
						(s) => ({
							borders: {
								...s.borders,
								[side]: { ...s.borders[side], size },
							},
						}),
						{ persist: "defer" },
					);
				},
				setEditingPanel: (pid) => {
					set((root) => ({
						layout: { ...root.layout, editingPanelId: pid },
					}));
				},
				setDragging: (pid) => {
					if (get().layout.draggingPanelId === pid) {
						return;
					}
					set((root) => ({
						layout: { ...root.layout, draggingPanelId: pid },
					}));
				},

				canClose: (pid) => flagOf(pid, "canClose"),
				canDrag: (pid) => flagOf(pid, "canDrag"),
				canMaximize: (pid) => flagOf(pid, "canMaximize"),
				canRename: (pid) => flagOf(pid, "canRename"),
				canSplitTab: (pid) => {
					if (!pid) {
						return false;
					}
					const state = get().layout;
					const record = state.panels[pid];
					if (!record) {
						return false;
					}
					// opt-in, so not a flagOf flag — those default to true
					return (
						record.canSplitTab ??
						state.components[record.type]?.canSplitTab ??
						false
					);
				},

				getPanel: (pid) => (pid ? get().layout.panels[pid] : undefined),
				findPanels: (predicate) =>
					Object.values(get().layout.panels).filter(predicate),
			},
		};
	};
};
