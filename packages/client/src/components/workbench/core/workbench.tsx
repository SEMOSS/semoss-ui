import { type FC, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Spinner, useIsMobile } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { useWorkbenchEvents } from "./use-workbench-events";
import type { WorkbenchBorderSlotCtx, WorkbenchProps } from "./workbench.types";
import { resolveBorderSlot, WorkbenchBorder } from "./workbench-border";
import { WorkbenchCommandPalette } from "./workbench-command-palette";
import { WorkbenchDragLayer } from "./workbench-drag-layer";
import { WorkbenchMobile } from "./workbench-mobile";
import { WorkbenchPanelLayer } from "./workbench-panel-layer";
import { WorkbenchPanelSheet } from "./workbench-panel-sheet";
import { WorkbenchResetButton } from "./workbench-reset-button";
import { WorkbenchStage } from "./workbench-stage";

/**
 * Whether whatever has focus should get Escape before the shell does — a field
 * being edited, or anything inside a menu, dialog, or listbox. The shell's own
 * Escape handling is a last resort, so a rename, a suggest widget, or an open
 * popover always wins.
 */
const focusOwnsEscape = (): boolean => {
	const el = document.activeElement;
	if (!(el instanceof HTMLElement)) {
		return false;
	}
	if (
		el.isContentEditable ||
		el.tagName === "INPUT" ||
		el.tagName === "TEXTAREA" ||
		el.tagName === "SELECT" ||
		el.getAttribute("aria-expanded") === "true"
	) {
		return true;
	}
	return Boolean(
		el.closest("[role='dialog'],[role='menu'],[role='listbox']"),
	);
};

/**
 * Re-measures slot geometry in the layout phase after any commit that can move
 * a slot. Panel bodies are absolutely positioned from those measurements, so
 * without this they keep their old rect while the dock frames reflow.
 *
 * It lives in its own leaf rather than in the shell because the shell reads
 * none of these fields: subscribing it would re-render every border, the panel
 * layer, and the drag layer on each of the ~60 commits a splitter drag makes.
 * Rendered last inside the root, so React's depth-first commit has already
 * attached every slot ref by the time this effect runs.
 */
const WorkbenchSlotMeasure: FC = () => {
	const actions = useWorkbench((s) => s.layout.actions);
	// subscribed for the re-render, not for the values: each of these is a way
	// a slot can move
	useWorkbench((s) => s.layout.tree);
	useWorkbench((s) => s.layout.borders);
	useWorkbench((s) => s.layout.maximizedTabsetId);
	useWorkbench((s) => s.layout.isMobileLayout);
	useWorkbench((s) => s.layout.panelSlots);

	// no dependency array: this component renders only when one of the
	// subscriptions above changed, which is exactly when slots need re-measuring
	useLayoutEffect(() => {
		actions.measureSlots();
	});

	return null;
};

/**
 * Initialize and render one workbench inside the nearest scoped provider.
 * Registers the blueprint map, hydrates the persisted layout (falling back
 * to the supplied default), and renders the dock frame, borders, panel
 * layer, and interaction chrome.
 */
export const Workbench: FC<WorkbenchProps> = ({
	components,
	layout,
	borderSlots,
	readOnly = false,
	onPanelOpen,
	onPanelClose,
	onSelectionChange,
}) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const hydrated = useWorkbench((s) => s.layout.hydrated);
	const isLoading = useWorkbench((s) => s.loading.isLoading);
	const isMobileLayout = useWorkbench((s) => s.layout.isMobileLayout);
	// a boolean, so the shell re-renders only when maximize actually flips
	const maximized = useWorkbench((s) => Boolean(s.layout.maximizedTabsetId));
	const isMobile = useIsMobile();

	const rootRef = useRef<HTMLDivElement | null>(null);
	const stageRef = useRef<HTMLDivElement | null>(null);

	// The shell's own rail chrome rides at the end of the left rail, after
	// whatever the host put there — so it sits in the rail's flow instead of
	// floating on top of it.
	const leftSlots = useMemo(() => {
		const hostAfter = borderSlots?.left?.after;
		if (readOnly && !hostAfter) {
			return borderSlots?.left;
		}
		return {
			before: borderSlots?.left?.before,
			after: (ctx: WorkbenchBorderSlotCtx) => (
				<>
					{resolveBorderSlot(hostAfter, ctx)}
					{readOnly ? null : <WorkbenchResetButton />}
				</>
			),
		};
	}, [borderSlots, readOnly]);

	useWorkbenchEvents({
		onPanelOpen,
		onPanelClose,
		onSelectionChange,
	});

	// blueprints must be registered before hydration reads them
	useLayoutEffect(() => {
		actions.registerComponents(components);
	}, [actions, components]);

	// restore the cached layout, falling back to the default. readOnly is read
	// once per layout identity, like the layout itself.
	const readOnlyRef = useRef(readOnly);
	readOnlyRef.current = readOnly;
	useLayoutEffect(() => {
		actions.loadLayout(layout, { readOnly: readOnlyRef.current });
	}, [actions, layout]);

	useEffect(() => {
		actions.setMobileLayout(isMobile);
	}, [actions, isMobile]);

	// slot geometry: the root has to be registered before anything can be
	// measured against it, and this effect runs after the children's — which is
	// why <WorkbenchSlotMeasure /> no-ops on mount and this does the first pass
	useLayoutEffect(() => {
		actions.registerRootElement(rootRef.current);
		return () => actions.registerRootElement(null);
	}, [actions]);
	// no dependency array: covers the mount pass above and any later render of
	// the shell itself. Layout commits are <WorkbenchSlotMeasure />'s job
	useLayoutEffect(() => {
		actions.measureSlots();
	});
	useEffect(() => {
		const root = rootRef.current;
		if (!root) {
			return;
		}
		const observer = new ResizeObserver(() => actions.measureSlots());
		observer.observe(root);
		return () => observer.disconnect();
	}, [actions]);

	// flush any deferred cache write when the workbench unmounts
	useEffect(() => () => actions.persistNow(), [actions]);

	// ⌘/Ctrl+M toggles maximize on the dock last worked in; Escape restores
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
				e.preventDefault();
				actions.toggleMaximize();
				return;
			}
			// last resort only: Escape reached the window unclaimed, with
			// nothing focused that it belongs to. Never maximizes — it can
			// only put a maximized dock back
			if (
				e.key === "Escape" &&
				maximized &&
				!e.defaultPrevented &&
				!focusOwnsEscape()
			) {
				actions.toggleMaximize();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [actions, maximized]);

	return (
		<>
			<WorkbenchCommandPalette />
			<div
				ref={rootRef}
				data-testid="workbench-shell"
				className="absolute inset-0 overflow-hidden bg-muted text-foreground"
			>
				{!hydrated ? (
					<div className="absolute inset-0 flex items-center justify-center">
						<Spinner />
					</div>
				) : isMobileLayout ? (
					<WorkbenchMobile />
				) : (
					<div className="relative flex h-full w-full flex-row gap-2 p-2">
						<WorkbenchBorder side="left" slots={leftSlots} />
						<div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2">
							<WorkbenchBorder
								side="top"
								slots={borderSlots?.top}
							/>
							<div
								ref={stageRef}
								className="relative flex min-h-0 flex-1"
							>
								<WorkbenchStage />
							</div>
							<WorkbenchBorder
								side="bottom"
								slots={borderSlots?.bottom}
							/>
						</div>
						<WorkbenchBorder
							side="right"
							slots={borderSlots?.right}
						/>
					</div>
				)}

				{isLoading ? (
					<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/50">
						<Spinner />
					</div>
				) : null}

				<WorkbenchPanelLayer />
				<WorkbenchDragLayer rootRef={rootRef} stageRef={stageRef} />
				<WorkbenchSlotMeasure />
			</div>
			<WorkbenchPanelSheet actionsSlot={borderSlots?.left?.after} />
		</>
	);
};
