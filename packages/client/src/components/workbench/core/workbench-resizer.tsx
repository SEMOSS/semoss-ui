import type { FC, PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type {
	WorkbenchContainer,
	WorkbenchSide,
	WorkbenchTabset,
} from "@/stores/workbench";

/**
 * Where a border's handle sits. It is placed into the shell gap beside the
 * border instead of taking a slice of the border's own width: in the flow the
 * gutter would be the handle *plus* the gap, leaving the grip visibly hugging
 * the panel rather than centred between it and the stage.
 */
const BORDER_GUTTER: Record<WorkbenchSide, string> = {
	left: "absolute inset-y-0 left-full w-2",
	right: "absolute inset-y-0 right-full w-2",
	top: "absolute inset-x-0 top-full h-2",
	bottom: "absolute inset-x-0 bottom-full h-2",
};

export type WorkbenchResizerProps =
	| { kind: "container"; container: WorkbenchContainer; index: number }
	| { kind: "tab-split"; tabset: WorkbenchTabset }
	| { kind: "border"; side: WorkbenchSide };

/**
 * A pointer-driven resize handle for containers, split-in-tab viewports, and
 * borders. Writes go through the store's deferred-persist resize actions and
 * are flushed once the drag ends.
 */
export const WorkbenchResizer: FC<WorkbenchResizerProps> = (props) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const borderSize = useWorkbench((s) =>
		props.kind === "border" ? s.layout.borders[props.side].size : 0,
	);
	// the panel open in this border, whose own constraints clamp the drag
	const borderPanel = useWorkbench((s) => {
		if (props.kind !== "border") {
			return undefined;
		}
		const openPid = s.layout.borders[props.side].activeId;
		return openPid ? s.layout.panels[openPid] : undefined;
	});

	const horizontal =
		props.kind === "container"
			? props.container.type === "row"
			: props.kind === "tab-split"
				? props.tabset.split?.dir === "row"
				: props.side === "left" || props.side === "right";

	const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		e.preventDefault();
		const handle = e.currentTarget as HTMLElement;
		const handleBox = handle.getBoundingClientRect();
		const box = handle.parentElement?.getBoundingClientRect();
		const start = horizontal ? e.clientX : e.clientY;
		// the handles sit inside the container's box but take no weight, so the
		// px-to-weight conversion has to run over the space actually shared out
		const handleExtent = horizontal ? handleBox.width : handleBox.height;

		// bind the pointer to the handle: the resize cursor survives passing
		// over other elements, and a fast drag cannot outrun the grip
		handle.setPointerCapture(e.pointerId);

		let apply: (ev: PointerEvent) => void = () => {};

		if (props.kind === "container") {
			if (!box) {
				return;
			}
			const { container, index } = props;
			const extent =
				(horizontal ? box.width : box.height) -
				(container.children.length - 1) * handleExtent;
			const sizes = container.children.map((child) => child.size);
			const total = sizes.reduce((sum, size) => sum + size, 0);
			// weights are relative, not normalized — a fixed floor would mean
			// 12.5% in a [1, 1] split and 28% in a [0.4, 1] one
			const floor = total * 0.05;
			apply = (ev) => {
				if (extent <= 0) {
					return;
				}
				const delta =
					(((horizontal ? ev.clientX : ev.clientY) - start) /
						extent) *
					total;
				const a = sizes[index] + delta;
				const b = sizes[index + 1] - delta;
				if (a < floor || b < floor) {
					return;
				}
				actions.resizeTreeChildren(container.id, index, a, b);
			};
		} else if (props.kind === "tab-split") {
			if (!box) {
				return;
			}
			const { tabset } = props;
			const extent = (horizontal ? box.width : box.height) - handleExtent;
			const from = tabset.split?.ratio ?? 0.5;
			apply = (ev) => {
				if (extent <= 0) {
					return;
				}
				const delta =
					((horizontal ? ev.clientX : ev.clientY) - start) / extent;
				const ratio = Math.max(0.15, Math.min(0.85, from + delta));
				actions.resizeTabSplit(tabset.id, ratio);
			};
		} else {
			const { side } = props;
			const size0 = borderSize;
			const sign = side === "left" || side === "top" ? 1 : -1;

			// the open panel's own constraints, falling back to the defaults
			const min =
				(horizontal ? borderPanel?.minWidth : borderPanel?.minHeight) ??
				140;
			const max =
				(horizontal ? borderPanel?.maxWidth : borderPanel?.maxHeight) ??
				640;

			apply = (ev) => {
				const delta =
					((horizontal ? ev.clientX : ev.clientY) - start) * sign;
				const size = Math.max(min, Math.min(max, size0 + delta));
				actions.resizeBorder(side, size);
			};
		}

		// one commit per frame: pointermove can fire several times between
		// paints, and every commit re-derives the tree and re-measures each
		// slot — doing that work twice for one frame is what makes a drag
		// feel like it is catching up rather than tracking
		let frame = 0;
		let latest: PointerEvent | null = null;
		const flush = () => {
			frame = 0;
			if (latest) {
				apply(latest);
			}
		};
		const onMove = (ev: PointerEvent) => {
			latest = ev;
			if (!frame) {
				frame = requestAnimationFrame(flush);
			}
		};

		// pointercancel too, or a cancelled drag leaves the move listener bound
		// and the divider keeps tracking the cursor with no button held
		const onUp = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
			if (frame) {
				cancelAnimationFrame(frame);
				frame = 0;
			}
			// land on the last position the pointer reached, not the last one
			// a frame happened to catch
			if (latest) {
				apply(latest);
			}
			actions.persistNow();
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
	};

	const thin = props.kind === "tab-split";

	// a focusable separator is a window splitter and must report its value
	let valueNow: number;
	let valueMin = 0;
	let valueMax = 100;
	if (props.kind === "container") {
		const a = props.container.children[props.index]?.size ?? 1;
		const b = props.container.children[props.index + 1]?.size ?? 1;
		valueNow = Math.round((a / (a + b)) * 100);
	} else if (props.kind === "tab-split") {
		valueNow = Math.round((props.tabset.split?.ratio ?? 0.5) * 100);
	} else {
		valueMin = 140;
		valueMax = 640;
		valueNow = Math.round(
			Math.max(valueMin, Math.min(valueMax, borderSize)),
		);
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: an <hr> cannot host a pointer-driven drag handle; a focusable separator is the ARIA window-splitter pattern
		<div
			role="separator"
			tabIndex={0}
			aria-orientation={horizontal ? "vertical" : "horizontal"}
			aria-label={
				props.kind === "border" ? "Resize border" : "Resize dock"
			}
			aria-valuenow={valueNow}
			aria-valuemin={valueMin}
			aria-valuemax={valueMax}
			onPointerDown={onPointerDown}
			className={cn(
				"group flex flex-none touch-none items-center justify-center outline-none",
				horizontal ? "cursor-col-resize" : "cursor-row-resize",
				props.kind === "border"
					? BORDER_GUTTER[props.side]
					: horizontal
						? thin
							? "w-1"
							: "w-2"
						: thin
							? "h-1"
							: "h-2",
			)}
		>
			<span
				className={cn(
					"rounded-full bg-transparent transition-colors",
					"group-hover:bg-primary group-focus-visible:bg-primary group-active:bg-primary",
					horizontal
						? thin
							? "h-6 w-0.5"
							: "h-8 w-1"
						: thin
							? "h-0.5 w-6"
							: "h-1 w-8",
				)}
			/>
		</div>
	);
};
