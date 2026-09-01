import { type FC, type RefObject, useEffect, useRef, useState } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkbench, useWorkbenchStoreApi } from "@/hooks";
import { useWorkbenchHitTest } from "./use-workbench-hit-test";
import type { WorkbenchDragState, WorkbenchDropInfo } from "./workbench.types";
import { ghostRect } from "./workbench-drop.ops";
import {
	isSpawnDrag,
	ownsItsDrops,
	readSpawnDragSpec,
} from "./workbench-spawn-drag";

export interface WorkbenchDragLayerProps {
	/** The workbench root, drag initiation is delegated from it. */
	rootRef: RefObject<HTMLDivElement | null>;
	/** The stage element edge bands and outside-crossings resolve against. */
	stageRef: RefObject<HTMLDivElement | null>;
}

/**
 * Owns both drag interactions the shell supports.
 *
 * **Moving a tab** is a pointer-event drag delegated from `[data-tab]`
 * elements inside the root; high-frequency pointer state stays local and the
 * store only learns which panel is dragging and receives the final
 * `movePanel` on drop.
 *
 * **Dropping something from outside** — a file dragged out of the explorer
 * tree — is a native HTML5 drag carrying `WORKBENCH_SPAWN_DRAG_TYPE`. It
 * resolves through the same `useWorkbenchHitTest` geometry and draws the same
 * ghost, so both gestures target splits, tab strips, and borders identically.
 */
export const WorkbenchDragLayer: FC<WorkbenchDragLayerProps> = ({
	rootRef,
	stageRef,
}) => {
	const storeApi = useWorkbenchStoreApi();
	const dragName = useWorkbench((s) =>
		s.layout.draggingPanelId
			? s.layout.panels[s.layout.draggingPanelId]?.name
			: undefined,
	);
	const [drag, setDrag] = useState<WorkbenchDragState | null>(null);
	const [drop, setDrop] = useState<WorkbenchDropInfo | null>(null);
	const dropRef = useRef<WorkbenchDropInfo | null>(null);
	dropRef.current = drop;

	// an external drag has no panel of its own, so it tracks its resolved drop
	// separately and renders only the ghost — the drag source already supplied
	// a native drag image
	const [spawnDrop, setSpawnDrop] = useState<WorkbenchDropInfo | null>(null);
	const spawnDropRef = useRef<WorkbenchDropInfo | null>(null);
	spawnDropRef.current = spawnDrop;

	const hitTest = useWorkbenchHitTest(stageRef);

	// drag initiation is delegated: any [data-tab] inside the root can start
	// one, so tabs and rail icons never wire their own drag handlers
	useEffect(() => {
		const root = rootRef.current;
		if (!root) {
			return;
		}

		const onPointerDown = (e: PointerEvent) => {
			if (e.button !== 0) {
				return;
			}
			const state = storeApi.getState();
			if (state.layout.isMobileLayout || state.layout.readOnly) {
				return;
			}
			const tabEl = (e.target as Element | null)?.closest("[data-tab]");
			if (!tabEl || !root.contains(tabEl)) {
				return;
			}
			// buttons inside a tab (close/pin) stop propagation themselves;
			// an inline rename input must not start a drag
			const pid = tabEl.getAttribute("data-tab");
			if (!pid || state.layout.editingPanelId === pid) {
				return;
			}
			if (!state.layout.actions.canDrag(pid)) {
				return;
			}

			const x0 = e.clientX;
			const y0 = e.clientY;
			let live = false;
			let frame = 0;
			let lastX = x0;
			let lastY = y0;

			const process = () => {
				frame = 0;
				setDrag({ pid, x: lastX, y: lastY });
				setDrop(hitTest(lastX, lastY));
			};

			const onMove = (ev: PointerEvent) => {
				lastX = ev.clientX;
				lastY = ev.clientY;
				if (!live) {
					if (Math.hypot(lastX - x0, lastY - y0) < 6) {
						return;
					}
					live = true;
					storeApi.getState().layout.actions.setDragging(pid);
				}
				if (!frame) {
					frame = requestAnimationFrame(process);
				}
			};

			// a cancelled pointer must tear the drag down too: `draggingPanelId`
			// left set keeps every panel body pointer-events: none, which makes
			// the whole workbench unclickable until reload
			const finish = (commit: boolean) => {
				window.removeEventListener("pointermove", onMove);
				window.removeEventListener("pointerup", onUp);
				window.removeEventListener("pointercancel", onCancel);
				if (frame) {
					cancelAnimationFrame(frame);
				}
				const currentDrop = dropRef.current;
				if (commit && live && currentDrop) {
					storeApi
						.getState()
						.layout.actions.movePanel(pid, currentDrop.target);
				}
				storeApi.getState().layout.actions.setDragging(undefined);
				setDrag(null);
				setDrop(null);
			};
			const onUp = () => finish(true);
			const onCancel = () => finish(false);

			window.addEventListener("pointermove", onMove);
			window.addEventListener("pointerup", onUp);
			window.addEventListener("pointercancel", onCancel);
		};

		root.addEventListener("pointerdown", onPointerDown);
		return () => root.removeEventListener("pointerdown", onPointerDown);
	}, [rootRef, storeApi, hitTest]);

	// native drags from outside the dock: same geometry, same ghost
	useEffect(() => {
		const root = rootRef.current;
		if (!root) {
			return;
		}

		let frame = 0;
		let lastX = 0;
		let lastY = 0;

		/** Drop the external drag's preview and any queued frame. */
		const clear = () => {
			if (frame) {
				cancelAnimationFrame(frame);
				frame = 0;
			}
			setSpawnDrop(null);
		};

		/** Resolve the drop for the latest pointer position, once per frame. */
		const process = () => {
			frame = 0;
			setSpawnDrop(hitTest(lastX, lastY));
		};

		/**
		 * Track a spawn drag across the shell and preview where it would land.
		 *
		 * @param e - The dragover event.
		 */
		const onDragOver = (e: DragEvent) => {
			if (!isSpawnDrag(e.dataTransfer)) {
				return;
			}

			const state = storeApi.getState();
			if (state.layout.isMobileLayout) {
				return;
			}

			// while the pointer is inside a region that handles its own drops
			// the drag belongs to that region — that is how a row-to-row file
			// move stays a move, and how the explorer's upload dropzone keeps
			// working
			if (ownsItsDrops(e.target)) {
				clear();
				return;
			}

			e.preventDefault();
			if (e.dataTransfer) {
				// a copy, not a move: the file stays where it is and we open a
				// view of it. This has to be one of the operations the source's
				// `effectAllowed` names — otherwise the browser resolves the
				// drag to "none", still draws our preview, and then silently
				// refuses to fire `drop`.
				e.dataTransfer.dropEffect = "copy";
			}

			lastX = e.clientX;
			lastY = e.clientY;
			if (!frame) {
				frame = requestAnimationFrame(process);
			}
		};

		/**
		 * Register the shell as a drop target. Chrome is satisfied by
		 * `dragover` alone; Firefox wants `dragenter` prevented too.
		 *
		 * @param e - The dragenter event.
		 */
		const onDragEnter = (e: DragEvent) => {
			if (!isSpawnDrag(e.dataTransfer)) {
				return;
			}
			if (ownsItsDrops(e.target)) {
				return;
			}
			e.preventDefault();
		};

		/**
		 * Open a new panel for the dragged spec at the resolved drop target.
		 *
		 * Always spawns, never reveals: dragging a file that is already open is
		 * a request for a second view of it, so the instance already on screen
		 * stays exactly where it is. (Clicking the file in the explorer is the
		 * gesture that reveals the existing one.)
		 *
		 * @param e - The drop event.
		 */
		const onDrop = (e: DragEvent) => {
			if (!isSpawnDrag(e.dataTransfer) || !e.dataTransfer) {
				return;
			}

			// The same guard `dragenter`/`dragover` use, and it matters most
			// here: a row dropped on a folder *inside* the tree bubbles up to
			// this listener too, and without the guard we would spawn a stray
			// panel and — because we stop propagation — swallow the move before
			// the explorer's own handler ever saw it.
			if (ownsItsDrops(e.target)) {
				clear();
				return;
			}

			const spec = readSpawnDragSpec(e.dataTransfer);
			// resolve from the drop's own coordinates rather than the previewed
			// state: it is the authoritative position, and it does not care
			// whether a `dragleave` happened to clear the preview first
			const target =
				hitTest(e.clientX, e.clientY)?.target ??
				spawnDropRef.current?.target;
			clear();

			if (!spec || !target) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			const actions = storeApi.getState().layout.actions;
			// spawn where the shell would put it, then move: `spawnPanel` only
			// honours `border` and `join` targets itself, so routing every drop
			// through `movePanel` is what makes `split` and `root` work too
			const pid = actions.spawnPanel(spec.type, {
				name: spec.name,
				config: spec.config,
			});
			actions.movePanel(pid, target);
		};

		/**
		 * Clear the preview once the drag genuinely leaves the shell.
		 *
		 * @param e - The dragleave event.
		 */
		const onDragLeave = (e: DragEvent) => {
			if (!isSpawnDrag(e.dataTransfer)) {
				return;
			}
			// a dragleave fires for every child crossing; only the one that
			// actually exits the root should tear the preview down
			if (e.relatedTarget && root.contains(e.relatedTarget as Node)) {
				return;
			}
			clear();
		};

		root.addEventListener("dragenter", onDragEnter);
		root.addEventListener("dragover", onDragOver);
		root.addEventListener("drop", onDrop);
		root.addEventListener("dragleave", onDragLeave);
		window.addEventListener("dragend", clear);
		return () => {
			root.removeEventListener("dragenter", onDragEnter);
			root.removeEventListener("dragover", onDragOver);
			root.removeEventListener("drop", onDrop);
			root.removeEventListener("dragleave", onDragLeave);
			window.removeEventListener("dragend", clear);
			if (frame) {
				cancelAnimationFrame(frame);
			}
		};
	}, [rootRef, storeApi, hitTest]);

	const activeDrop = drag ? drop : spawnDrop;
	if (!activeDrop && !drag) {
		return null;
	}

	const preview = activeDrop ? ghostRect(activeDrop) : null;

	return (
		<>
			{preview && activeDrop && (
				<div
					aria-hidden
					style={{
						left: preview.left,
						top: preview.top,
						width: preview.width,
						height: preview.height,
					}}
					className={cn(
						"pointer-events-none fixed z-40",
						activeDrop.zone === "strip"
							? // an insertion caret: solid, thin, nothing dimmed
								"rounded-full bg-primary"
							: // a region: outlined and lightly filled, so the
								// dock and its tabs stay readable underneath
								"rounded-lg border-2 border-primary bg-primary/15",
					)}
				/>
			)}
			{drag && (
				<div
					aria-hidden
					style={{ left: drag.x + 10, top: drag.y + 10 }}
					className="pointer-events-none fixed z-50 rounded border border-border bg-card px-2 py-1 text-foreground text-xs shadow-lg"
				>
					{dragName}
				</div>
			)}
		</>
	);
};
