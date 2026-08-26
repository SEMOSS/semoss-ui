import type { ComponentType, ReactNode } from "react";
import type { StateCreator } from "zustand";
import type { WorkbenchState } from "./workbench.store";

/** Unique id of one panel instance. */
export type WorkbenchPanelId = string;

/** Key into a workbench's components map — which blueprint an instance is of. */
export type WorkbenchPanelType = string;

/**
 * One panel instance's config with its shape unknown — the erased form the
 * store holds, and the default for a panel that declares no config type.
 */
export type WorkbenchPanelParams = Record<string, unknown>;

/** One edge of the workbench stage. */
export type WorkbenchSide = "left" | "right" | "top" | "bottom";

/** Every side, in visual order. */
export const WORKBENCH_SIDES: WorkbenchSide[] = [
	"left",
	"right",
	"top",
	"bottom",
];

/** A measured rectangle, relative to the workbench root. */
export interface WorkbenchRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * A measured slot: where a panel body is drawn, and the `border-radius` it
 * should clip to. Bodies live in the overlay rather than inside their card, so
 * the card's own `overflow-hidden` cannot round them — each slot declares the
 * corners it meets and the body carries them itself.
 */
export interface WorkbenchSlotRect extends WorkbenchRect {
	radius: string;
}

/** A dock holding a strip of panels, one of which is active. */
export interface WorkbenchTabset {
	type: "tabset";
	id: string;
	/** Flex weight relative to the tabset's siblings. */
	size: number;
	panelIds: WorkbenchPanelId[];
	activeId: WorkbenchPanelId | null;
	/** Per-tabset capabilities, all default true. */
	enableDrop?: boolean;
	enableTabStrip?: boolean;
	enableMaximize?: boolean;
	/**
	 * When false the tabset survives its last panel close and renders an
	 * empty placeholder instead of being pruned from the tree.
	 */
	enableDeleteWhenEmpty?: boolean;
	/** Two viewports onto the active panel, inside this one dock. */
	split?: { dir: "row" | "col"; ratio?: number };
}

/** A row or column of nested layout nodes. */
export interface WorkbenchContainer {
	type: "row" | "col";
	id: string;
	/** Flex weight relative to the container's siblings. */
	size: number;
	children: WorkbenchLayoutNode[];
}

/** One node of the layout tree. */
export type WorkbenchLayoutNode = WorkbenchTabset | WorkbenchContainer;

/** Where a moved panel is headed. */
export type WorkbenchMoveTarget =
	| {
			kind: "join";
			tabsetId: string;
			/** Insertion index, already in post-removal coordinates when resolved. */
			index?: number;
			resolved?: boolean;
	  }
	| { kind: "split"; tabsetId: string; dir: WorkbenchSide }
	| { kind: "root"; dir: WorkbenchSide }
	| { kind: "border"; side: WorkbenchSide; index?: number };

/** All four border edges: each one's panels, the open one, and its size. */
export type WorkbenchBorders = Record<
	WorkbenchSide,
	{
		panelIds: WorkbenchPanelId[];
		activeId: WorkbenchPanelId | null;
		/** Open size in px (width for left/right, height for top/bottom). */
		size: number;
	}
>;

/**
 * One panel instance: a unique id pointing at a component type, with its own
 * name, config, and optional per-instance capability overrides.
 */
export interface WorkbenchPanelRecord {
	id: WorkbenchPanelId;
	type: WorkbenchPanelType;
	name: string;
	config?: WorkbenchPanelParams;
	/** Kept at the head of the strip and skipped by bulk closes. */
	pinned?: boolean;
	/** Per-instance overrides of the blueprint's capability flags. */
	canClose?: boolean;
	canDrag?: boolean;
	canMaximize?: boolean;
	/** Whether the user may rename this tab (programmatic renames always work). */
	canRename?: boolean;
	/** Tooltip shown on the tab and border rail icon. */
	helpText?: string;
	/**
	 * Px constraints for whatever holds this panel — a dock tabset takes the
	 * strictest constraint among its panels, a border clamps its open size.
	 */
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
}

/** Load status of a panel type's body. */
export type WorkbenchPanelStatus = "pending" | "loading" | "ready" | "error";

/**
 * Where a panel's tab is being drawn: a dock strip, a top/bottom border rail,
 * or a left/right one — where the tab is turned on its side, and a glyph has
 * to turn with it.
 */
export type WorkbenchHeaderLocation = "tab" | "rail" | "rail-vertical";

/**
 * The per-instance methods half of a panel's props. `P` is the panel's config
 * shape, `V` its scratch value.
 */
export interface WorkbenchPanelMethods<P = WorkbenchPanelParams, V = unknown> {
	rename: (name: string) => void;
	close: () => void;
	moveTo: (target: WorkbenchMoveTarget) => void;
	/** Merge a partial patch into this panel's config. */
	setConfig: (patch: Partial<P>) => void;
	setValue: (value: V | ((prev: V | undefined) => V)) => void;
	/** Reveal (or open) another panel — how panels drive each other. */
	select: (
		type: WorkbenchPanelType,
		config?: WorkbenchPanelParams,
	) => WorkbenchPanelId;
}

/**
 * Everything a panel renderer is handed about its own instance: its record,
 * its live state, and the methods bound to its id.
 */
export interface WorkbenchPanelProps<P = WorkbenchPanelParams, V = unknown>
	extends WorkbenchPanelMethods<P, V> {
	id: WorkbenchPanelId;
	type: WorkbenchPanelType;
	name: string | undefined;
	config: P;
	value: V | undefined;
	/** False while a keepAlive/eager panel is mounted but hidden. */
	isVisible: boolean;
}

/**
 * A panel body. Annotate your component with this to type its props:
 * `const MyPanel: WorkbenchComponent<MyPanelConfig> = ({ config }) => …`.
 */
export type WorkbenchComponent<P = WorkbenchPanelParams, V = unknown> = (
	props: WorkbenchPanelProps<P, V>,
) => ReactNode;

/**
 * What the chrome renderers get: the same flat props, plus where they are being
 * drawn and whether the body has resolved yet.
 */
export type WorkbenchChromeProps<
	P = WorkbenchPanelParams,
	V = unknown,
> = WorkbenchPanelProps<P, V> & {
	location: WorkbenchHeaderLocation;
	status: WorkbenchPanelStatus;
};

/** A panel's header or controls renderer. */
export type WorkbenchChrome<P = WorkbenchPanelParams, V = unknown> = (
	props: WorkbenchChromeProps<P, V>,
) => ReactNode;

/** A palette command contributed by a panel instance. */
export interface WorkbenchPanelCommand {
	id: string;
	label: string;
	hint?: string | undefined;
	run: () => void;
}

/**
 * An entry a panel contributes to its own tab/rail context menu. `disabled`
 * items are filtered out, same as the built-in ones.
 */
export interface WorkbenchPanelMenuItem {
	id: string;
	label: string;
	run: () => void;
	disabled?: boolean;
}

/**
 * A blueprint, keyed by type in the components map. Panel instances name a
 * type from that map and share its loaded module and capability defaults.
 *
 * `P` is the shape of the `config` its instances are opened with, `V` its
 * scratch value type. Annotating them here is what types every renderer's
 * props: `WorkbenchPanelConfig<MyPanelConfig>` gives `content`, `icon`,
 * `header`, `controls`, and `matches` a typed `config` with no casts.
 *
 * Note the two senses of "config": this type is the panel's *definition*,
 * while `WorkbenchPanelProps.config` is one instance's parameters.
 */
export interface WorkbenchPanelConfig<P = WorkbenchPanelParams, V = unknown> {
	/** Default instance name. */
	name?: string;
	/**
	 * Capability flags, honoured by the shell. All default to true and are
	 * read before content exists — a tab can be dragged, closed, or maximized
	 * long before its body has resolved.
	 */
	canClose?: boolean;
	canDrag?: boolean;
	canMaximize?: boolean;
	/** Whether the user may rename instances of this type. Defaults to true. */
	canRename?: boolean;
	/** Tooltip shown on the tab and border rail icon. */
	helpText?: string;
	/**
	 * When this type's body mounts and unmounts.
	 *
	 * - `"lazy"` (default) unmounts a panel when it stops being visible.
	 * - `"keepAlive"` keeps it mounted and hidden once it has been shown, so
	 *   editors, terminals, and in-flight work survive a tab switch.
	 * - `"eager"` mounts it hidden as soon as the instance exists, before it
	 *   is ever shown.
	 */
	mount?: "lazy" | "keepAlive" | "eager";
	/**
	 * Does an existing instance count as "the same thing" for selectPanel()?
	 * Defaults to a shallow compare of config.
	 */
	matches?: (a: P, b: P) => boolean;
	/**
	 * The glyph. Drawn alone on a border rail and inline by the default
	 * header.
	 */
	icon?: ComponentType<WorkbenchChromeProps<P, V> & { className: string }>;
	/** The tab and border-header label. Omit for icon + instance name. */
	header?: ComponentType<WorkbenchChromeProps<P, V>>;
	/** Controls drawn next to the active tab / border header. */
	controls?: ComponentType<WorkbenchChromeProps<P, V>>;
	/**
	 * The body. Wrap it in React.lazy to code-split it — the shell renders it
	 * inside Suspense and shows a skeleton while it resolves. (These slots take
	 * a `ComponentType` rather than the bare function aliases so `React.lazy`
	 * and class components still fit.)
	 */
	content?: ComponentType<WorkbenchPanelProps<P, V>>;
	/**
	 * Palette commands contributed per open instance. Called outside React, so
	 * reach store state through `get` rather than a hook — the same convention
	 * as `useWorkbenchCommands`' `handler: (get) => …`. Prefer
	 * `useWorkbenchCommands` from inside the body when the command needs React
	 * state.
	 */
	commands?: (
		panel: WorkbenchPanelProps<P, V>,
		get: () => WorkbenchState,
	) => WorkbenchPanelCommand[];
	/**
	 * Entries appended to this panel's context menu, below the built-ins. Also
	 * called outside React — see `commands`.
	 */
	menuItems?: (
		panel: WorkbenchPanelProps<P, V>,
		get: () => WorkbenchState,
	) => WorkbenchPanelMenuItem[];
}

/**
 * A definition with its generics erased — what the components map holds and
 * what the shell renders. The registry is heterogeneous and the shell only ever
 * has a `WorkbenchPanelParams` bag at runtime, so the parameters are `any` here
 * and are recovered from each definition's own annotation at its declaration
 * site.
 */
// biome-ignore lint/suspicious/noExplicitAny: existential erasure, see above
export type WorkbenchPanelConfigAny = WorkbenchPanelConfig<any, any>;

/** A place panels live — a dock tabset or a border. */
export interface WorkbenchStack {
	key: string;
	kind: "tabset" | "border";
	id: string;
	label: string;
	panelIds: WorkbenchPanelId[];
	activeId: WorkbenchPanelId | null;
}

/** Which slot a panel body is drawn over, and whether it is the shown one. */
export interface WorkbenchPanelSlot {
	slot: string;
	active: boolean;
}

/** A complete arrangement: which instances exist and where they sit. */
export interface WorkbenchLayout {
	/**
	 * This arrangement's version, and part of its cache key. Bump it whenever
	 * the default's shape changes: cached copies are orphaned rather than
	 * migrated, so a stale one would otherwise shadow the new default forever.
	 */
	version: number;
	tree: WorkbenchLayoutNode;
	panels: Record<WorkbenchPanelId, WorkbenchPanelRecord>;
	/** Any side may be omitted; missing ones start empty. */
	borders?: Partial<WorkbenchBorders>;
	selectedPanelId?: WorkbenchPanelId;
	maximizedTabsetId?: string;
}

/**
 * A serialised arrangement. `v` guards the serialisation shape; the layout's
 * own `version` is in the cache key rather than the payload.
 */
export type WorkbenchSnapshot = Omit<WorkbenchLayout, "version"> & {
	v: 1;
	closed?: WorkbenchPanelId[];
};

/** Options accepted when spawning or selecting a panel instance. */
export type WorkbenchPanelOptions = Partial<
	Omit<WorkbenchPanelRecord, "id" | "type">
> & {
	/** Where the new instance docks. Defaults to the selected dock. */
	target?: WorkbenchMoveTarget;
};

/** Declarative command exposed by a workbench panel. */
export interface WorkbenchCommand {
	id: string;
	label: string;
	description?: string;
	icon?: ReactNode;
	handler: (get: () => WorkbenchState) => void;
}

/**
 * State creator for one workbench slice. `set`/`get` are the whole store's, so
 * a slice reads and writes through its own namespace — `get().layout.tree`,
 * `set((root) => ({ layout: { ...root.layout, tree } }))` — and can reach
 * across namespaces when it has to.
 */
export type WorkbenchSlice<Output> = StateCreator<
	WorkbenchState,
	[],
	[],
	Output
>;
