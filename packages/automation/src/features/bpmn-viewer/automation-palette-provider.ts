import type { LucideIcon } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
	CATEGORY_META,
	CATEGORY_ORDER,
} from "../../components/canvas-editor/add-node-menu";
import {
	getAutomationNodeDefinitions,
	hasAutomationNodeDefinitions,
} from "../../domain/automation-node-catalog";
import type {
	AutomationNodeCategory,
	AutomationNodeDefinition,
} from "../../domain/automation-workflow.types";
import { getWorkflowNodeDisplay } from "../../domain/automation-workflow-display";
import { BPMN_ELEMENT_TYPE } from "./bpmn-node-mapping";

/**
 * Height, in px, the palette leaves free at the bottom of the canvas for the
 * view switcher. The viewer caps the palette at the canvas height minus this.
 */
export const PALETTE_RESERVED_HEIGHT = 96;

/** Provider priority below bpmn-js's default (1000), so it edits the defaults. */
const PROVIDER_PRIORITY = 500;

/** Palette entry shape the bpmn-js palette consumes. */
interface PaletteEntry {
	group?: string;
	title?: string;
	html?: string;
	separator?: boolean;
	action?: Record<string, (event: Event) => void>;
}

interface PaletteEntries {
	[id: string]: PaletteEntry;
}

interface PaletteService {
	_needsCollapse: (
		availableHeight: number,
		entries: PaletteEntries,
	) => boolean;
	registerProvider: (
		priority: number,
		provider: {
			getPaletteEntries: () => (
				entries: PaletteEntries,
			) => PaletteEntries;
		},
	) => void;
}

interface CreateService {
	start: (event: Event, shape: unknown) => void;
}

interface BpmnFactoryService {
	create: (type: string, attrs?: Record<string, unknown>) => unknown;
}

interface ElementFactoryService {
	createShape: (attrs: Record<string, unknown>) => unknown;
}

interface CanvasService {
	getContainer: () => HTMLElement;
	resized: () => void;
}

interface EventBusService {
	on: (event: string, listener: () => void) => void;
}

/**
 * Extra attributes some node types need on the shape the palette creates, so
 * the shape looks like what it does: a loop is an expanded sub-process, and a
 * wait is a timer.
 */
const SHAPE_OPTIONS: Partial<Record<string, Record<string, unknown>>> = {
	"control.loop": { isExpanded: true },
	"control.wait": { eventDefinitionType: "bpmn:TimerEventDefinition" },
};

/**
 * Node types that keep the stock bpmn-js icon in the type picker, so they read
 * the same as the shapes they create: the decision gateways and the timer.
 */
const BPMN_ICON_CLASS: Partial<Record<string, string>> = {
	"control.if": "bpmn-icon-gateway-xor",
	"control.jev": "bpmn-icon-gateway-xor",
	"control.wait": "bpmn-icon-intermediate-event-catch-timer",
};

const iconHtmlCache = new Map<string, string>();

/** Renders an icon to an inline SVG string, once per key. */
function renderIcon(key: string, icon: LucideIcon): string {
	const cached = iconHtmlCache.get(key);
	if (cached) return cached;
	const svg = renderToStaticMarkup(
		createElement(icon, {
			size: 22,
			strokeWidth: 1.75,
			"aria-hidden": true,
		}),
	);
	iconHtmlCache.set(key, svg);
	return svg;
}

/**
 * The node types the palette offers, by category. The trigger is left out, as
 * in the add-node menu: the start event is part of the workflow, not something
 * to drop on repeatedly.
 */
function getPaletteCategories(): {
	category: AutomationNodeCategory;
	definitions: AutomationNodeDefinition[];
}[] {
	if (!hasAutomationNodeDefinitions()) return [];
	const definitions = getAutomationNodeDefinitions().filter(
		(definition) => definition.type !== "trigger.start",
	);
	return CATEGORY_ORDER.map((category) => ({
		category,
		definitions: definitions.filter(
			(definition) => definition.category === category,
		),
	})).filter(({ definitions: inCategory }) => inCategory.length > 0);
}

/** Builds one row of the type picker: icon, label and description. */
function createMenuItem(
	definition: AutomationNodeDefinition,
): HTMLButtonElement {
	const item = document.createElement("button");
	item.type = "button";
	item.setAttribute("role", "menuitem");
	item.className =
		"flex w-full items-start gap-2 rounded-md p-2 text-left outline-none hover:bg-muted focus-visible:bg-muted";

	const icon = document.createElement("span");
	const bpmnIconClass = BPMN_ICON_CLASS[definition.type];
	if (bpmnIconClass) {
		icon.className = `${bpmnIconClass} mt-0.5 shrink-0 text-base text-primary`;
	} else {
		icon.className = "mt-0.5 shrink-0 text-primary";
		icon.innerHTML = renderIcon(
			definition.type,
			getWorkflowNodeDisplay(definition.type).icon,
		);
		icon.querySelector("svg")?.setAttribute("width", "16");
		icon.querySelector("svg")?.setAttribute("height", "16");
	}

	const text = document.createElement("span");
	text.className = "min-w-0";
	const label = document.createElement("span");
	label.className = "block font-medium text-foreground text-sm";
	label.textContent = definition.label;
	const description = document.createElement("span");
	description.className = "block text-muted-foreground text-xs";
	description.textContent = definition.description;
	text.append(label, description);

	item.append(icon, text);
	return item;
}

/**
 * Replaces bpmn-js's generic element palette with the automation node types.
 *
 * The default entries (tasks, events, gateways, data objects, pools) create
 * shapes that cannot say which automation node they stand for, so every drop
 * had to be re-typed afterwards. The palette shows one entry per node
 * category; clicking one opens a menu of that category's node types (or
 * creates the node straight away when the category has only one). The chosen
 * type creates the matching BPMN shape tagged with `semossType`, which the
 * event bridge reads when it turns the new shape into an automation node. The
 * hand, lasso, space and connect tools are kept.
 */
export function AutomationPaletteProvider(
	palette: PaletteService,
	create: CreateService,
	elementFactory: ElementFactoryService,
	bpmnFactory: BpmnFactoryService,
	canvas: CanvasService,
	eventBus: EventBusService,
): void {
	let closeMenu: (() => void) | null = null;

	const startCreate = (
		event: Event,
		definition: AutomationNodeDefinition,
	) => {
		const bpmnType = BPMN_ELEMENT_TYPE[definition.type];
		const shape = elementFactory.createShape({
			type: bpmnType,
			businessObject: bpmnFactory.create(bpmnType, {
				name: definition.label,
			}),
			semossType: definition.type,
			...SHAPE_OPTIONS[definition.type],
		});
		create.start(event, shape);
	};

	const openMenu = (
		event: Event,
		anchor: HTMLElement,
		category: AutomationNodeCategory,
		definitions: AutomationNodeDefinition[],
	) => {
		const wasOpenForAnchor = menuAnchor === anchor;
		closeMenu?.();
		if (wasOpenForAnchor) return;

		const container = canvas.getContainer();
		const containerRect = container.getBoundingClientRect();
		const anchorRect = anchor.getBoundingClientRect();

		const menu = document.createElement("div");
		menu.setAttribute("role", "menu");
		menu.setAttribute("aria-label", CATEGORY_META[category].label);
		menu.className =
			"absolute z-50 w-64 rounded-lg border bg-background p-1 shadow-md";
		menu.style.left = `${anchorRect.right - containerRect.left + 8}px`;
		menu.style.top = `${anchorRect.top - containerRect.top}px`;

		const items = definitions.map((definition) => {
			const item = createMenuItem(definition);
			item.addEventListener("click", (clickEvent) => {
				closeMenu?.();
				startCreate(clickEvent, definition);
			});
			return item;
		});
		menu.append(...items);

		const onPointerDown = (pointerEvent: PointerEvent) => {
			if (
				pointerEvent.target instanceof Node &&
				menu.contains(pointerEvent.target)
			) {
				return;
			}
			closeMenu?.();
		};
		const onKeyDown = (keyEvent: KeyboardEvent) => {
			if (keyEvent.key === "Escape") {
				closeMenu?.();
				return;
			}
			if (keyEvent.key !== "ArrowDown" && keyEvent.key !== "ArrowUp")
				return;
			keyEvent.preventDefault();
			const current = items.indexOf(
				document.activeElement as HTMLButtonElement,
			);
			const step = keyEvent.key === "ArrowDown" ? 1 : -1;
			items[(current + step + items.length) % items.length]?.focus();
		};

		menuAnchor = anchor;
		closeMenu = () => {
			menu.remove();
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("keydown", onKeyDown, true);
			menuAnchor = null;
			closeMenu = null;
		};
		// Swallow the click that opened the menu so it cannot close it.
		event.stopPropagation();
		container.append(menu);
		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("keydown", onKeyDown, true);
		items[0]?.focus();
	};
	let menuAnchor: HTMLElement | null = null;

	/** Opens the type picker next to the palette entry an event came from. */
	const openFromEvent = (
		event: Event,
		category: AutomationNodeCategory,
		definitions: AutomationNodeDefinition[],
	) => {
		const target = (event.currentTarget ??
			event.target) as HTMLElement | null;
		const entry = target?.closest<HTMLElement>(".entry") ?? target;
		if (entry) openMenu(event, entry, category, definitions);
	};

	// Collapse to two columns against the height the palette can really use,
	// so it never ends up a scrolling single column.
	const needsCollapse = palette._needsCollapse.bind(palette);
	palette._needsCollapse = (availableHeight, entries) =>
		needsCollapse(availableHeight - PALETTE_RESERVED_HEIGHT, entries);

	// bpmn-js only re-lays the palette out on `canvas.resized`, which a panel
	// resize never fires. Without this the palette keeps a stale column count
	// after the canvas grows or shrinks.
	const resizeObserver = new ResizeObserver(() => canvas.resized());
	resizeObserver.observe(canvas.getContainer());

	eventBus.on("diagram.destroy", () => {
		closeMenu?.();
		resizeObserver.disconnect();
	});

	palette.registerProvider(PROVIDER_PRIORITY, {
		getPaletteEntries: () => (defaults) => {
			// Keep every stock bpmn-js entry and add the automation node types
			// after them.
			const entries: PaletteEntries = { ...defaults };
			const categories = getPaletteCategories();
			if (categories.length > 0) {
				entries["automation-separator"] = {
					group: "automation",
					separator: true,
				};
			}

			for (const { category, definitions } of categories) {
				const [only] = definitions;
				const single = definitions.length === 1 ? only : undefined;
				const meta = CATEGORY_META[category];
				entries[`create.category.${category}`] = {
					group: "automation",
					title: single ? single.label : `${meta.label}…`,
					html: `<div class="entry" draggable="true" style="display:flex;align-items:center;justify-content:center">${renderIcon(
						`category:${category}`,
						meta.icon,
					)}</div>`,
					action: {
						// A category with several types cannot start a drag
						// without knowing which one, so dragging it opens the
						// picker instead.
						dragstart: (event) => {
							if (single) {
								closeMenu?.();
								startCreate(event, single);
								return;
							}
							event.preventDefault();
							openFromEvent(event, category, definitions);
						},
						click: (event) => {
							if (single) {
								closeMenu?.();
								startCreate(event, single);
								return;
							}
							openFromEvent(event, category, definitions);
						},
					},
				};
			}
			return entries;
		},
	});
}

AutomationPaletteProvider.$inject = [
	"palette",
	"create",
	"elementFactory",
	"bpmnFactory",
	"canvas",
	"eventBus",
];

/** bpmn-js module that installs {@link AutomationPaletteProvider}. */
export const automationPaletteModule = {
	__init__: ["automationPaletteProvider"],
	automationPaletteProvider: ["type", AutomationPaletteProvider],
};
