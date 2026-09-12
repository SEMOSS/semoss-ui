import { type FC, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Spinner, useIsMobile } from "@semoss/ui/next";
import { useWorkbench, useWorkbenchEvents } from "../../hooks";
import type {
	WorkbenchBorderSlotCtx,
	WorkbenchBorderSlots,
	WorkbenchPanelId,
	WorkbenchPanelRecord,
	WorkbenchSnapshot,
} from "../../types";
import { resolveBorderSlot, WorkbenchBorder } from "./workbench-border";
import { WorkbenchCommandPalette } from "./workbench-command-palette";
import { WorkbenchDragLayer } from "./workbench-drag-layer";
import { WorkbenchMobile } from "./workbench-mobile";
import { WorkbenchPanelLayer } from "./workbench-panel-layer";
import { WorkbenchResetButton } from "./workbench-reset-button";
import { WorkbenchSlotMeasure } from "./workbench-slot-measure";
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

/** Props of the workbench shell. */
interface WorkbenchProps {
	/**
	 * What to open with — whatever the host restored, or its default when it
	 * restored nothing. Read once per identity, so a host may pass the same
	 * object on every render; the store owns it after.
	 */
	snapshot: WorkbenchSnapshot;

	/**
	 * Handed a fresh snapshot whenever the arrangement moves, for a host that
	 * persists continuously.
	 *
	 * Fires while this shell is mounted and only then, so a dock that is also
	 * written to while unmounted — a panel opened by something outside React —
	 * sees those writes at its next change or at `onUnmount`.
	 *
	 * Don't pass this alongside a `snapshot` that changes identity: the
	 * re-apply would be reported back as a change and overwrite whatever the
	 * host just switched to.
	 */
	onChange?: (snapshot: WorkbenchSnapshot) => void;

	/**
	 * Handed this workbench's snapshot when the shell unmounts.
	 *
	 * Named for when it fires, because that is the whole of it: React runs
	 * cleanups on navigation, **not** on a refresh or a closed tab.
	 */
	onUnmount?: (snapshot: WorkbenchSnapshot) => void;

	/**
	 * Rail add-ons per side (before/after the icon list). A rail carrying slot
	 * content renders even with no panels docked to it. The mobile layout has
	 * no rails, so `left.after` and `top.after` surface in the actions drawer.
	 */
	borderSlots?: WorkbenchBorderSlots;

	/** Fired when a panel becomes docked somewhere. */
	onPanelOpen?: (pid: WorkbenchPanelId) => void;

	/** Fired when a panel stops being docked, with its (still stored) record. */
	onPanelClose?: (
		pid: WorkbenchPanelId,
		record: WorkbenchPanelRecord,
	) => void;

	/** Fired when the selected panel changes. */
	onSelectionChange?: (pid: WorkbenchPanelId | undefined) => void;
}

/**
 * Initialize and render one workbench inside the nearest scoped provider.
 * Applies the arrangement it is given and renders the dock frame, borders,
 * panel layer, and interaction chrome. Blueprints come from the store, which
 * was built with them.
 */
export const Workbench: FC<WorkbenchProps> = ({
	snapshot,
	onChange,
	onUnmount,
	borderSlots,
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
		return {
			before: borderSlots?.left?.before,
			after: (ctx: WorkbenchBorderSlotCtx) => (
				<>
					{resolveBorderSlot(hostAfter, ctx)}
					<WorkbenchResetButton />
				</>
			),
		};
	}, [borderSlots]);

	useWorkbenchEvents({
		onPanelOpen,
		onPanelClose,
		onSelectionChange,
		onChange,
	});

	// apply the arrangement the host restored
	useLayoutEffect(() => {
		actions.loadSnapshot(snapshot);
	}, [actions, snapshot]);

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

	// hand the host its snapshot on the way out
	const onUnmountRef = useRef(onUnmount);
	onUnmountRef.current = onUnmount;
	useEffect(
		() => () => {
			onUnmountRef.current?.(actions.getSnapshot());
		},
		[actions],
	);

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

	const mobileActionsSlot = useMemo(() => {
		const leftAfter = borderSlots?.left?.after;
		const topAfter = borderSlots?.top?.after;

		if (!topAfter) {
			return leftAfter;
		}

		return (ctx: WorkbenchBorderSlotCtx) => (
			<>
				{resolveBorderSlot(leftAfter, ctx)}
				{resolveBorderSlot(topAfter, {
					...ctx,
					side: "top",
					vertical: false,
				})}
			</>
		);
	}, [borderSlots]);

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
					<WorkbenchMobile actionsSlot={mobileActionsSlot} />
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
		</>
	);
};
