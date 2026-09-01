import { type FC, memo, useCallback } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type { WorkbenchPanelId } from "@/stores/workbench";
import { useWorkbenchPanel } from "./use-workbench-panel";
import { WorkbenchPanelBody } from "./workbench-panel-body";

export interface WorkbenchPanelHostProps {
	pid: WorkbenchPanelId;
	/**
	 * Draw over this slot instead of the panel's own — used by split-in-tab
	 * secondary viewports.
	 */
	slotKeyOverride?: string;
	/** True for the split's second viewport: always shown, aria-hidden. */
	secondary?: boolean;
}

/**
 * One absolutely-positioned panel body, drawn over its measured slot. Bodies
 * live in the flat panel layer rather than inside the docks, so moving a tab
 * between docks only changes where a body is drawn — React never unmounts
 * it, and editors, terminals, and scroll positions survive the move.
 */
export const WorkbenchPanelHost: FC<WorkbenchPanelHostProps> = memo(
	({ pid, slotKeyOverride, secondary = false }) => {
		const actions = useWorkbench((s) => s.layout.actions);
		const record = useWorkbench((s) => s.layout.panels[pid]);
		const component = useWorkbench((s) => {
			const type = s.layout.panels[pid]?.type;
			return type ? s.layout.components[type] : undefined;
		});
		const slotKey = useWorkbench(
			(s) => slotKeyOverride ?? s.layout.panelSlots[pid]?.slot,
		);
		const active = useWorkbench((s) =>
			secondary ? true : (s.layout.panelSlots[pid]?.active ?? false),
		);
		const rect = useWorkbench((s) =>
			slotKey ? s.layout.slotRects[slotKey] : undefined,
		);
		const dragging = useWorkbench((s) => Boolean(s.layout.draggingPanelId));
		// bodies live in one flat layer, so the maximized dock's has to clear
		// the backdrop by hand — every other body stays under it
		const maximizedId = useWorkbench((s) => s.layout.maximizedTabsetId);
		const lifted =
			Boolean(maximizedId) &&
			(slotKey === maximizedId || slotKey === `${maximizedId}::b`);
		const panel = useWorkbenchPanel(pid);

		const type = record?.type ?? "";
		const handleReady = useCallback(
			() => actions.markComponentReady(type),
			[actions, type],
		);
		const handleError = useCallback(
			() => actions.markComponentError(type),
			[actions, type],
		);
		const handleSelect = useCallback(
			() => actions.setSelectedPanel(pid),
			[actions, pid],
		);

		const shown = active && Boolean(rect);

		return (
			<div
				role="tabpanel"
				aria-labelledby={`tab-${pid}`}
				aria-hidden={secondary || undefined}
				hidden={!shown}
				data-testid={`workbench-panel-host-${pid}`}
				// Selection runs in the click phase, not on pointerdown. Marking
				// a panel selected re-renders its body, and a body that
				// rebuilds the node under the pointer between pointerdown and
				// click destroys the click — the browser then has no common
				// ancestor to dispatch to, so the first click on a file did
				// nothing and only the second (already selected, no re-render)
				// landed. Capture, so an inner handler's stopPropagation
				// cannot skip it; React flushes the update after the whole
				// dispatch, so inner handlers still run.
				onClickCapture={handleSelect}
				style={
					rect
						? {
								position: "absolute",
								left: rect.left,
								top: rect.top,
								width: rect.width,
								height: rect.height,
								// the card cannot clip a body that lives in the
								// overlay, so the body carries the card's curve
								borderRadius: rect.radius,
							}
						: {
								position: "absolute",
								left: 0,
								top: 0,
								width: 0,
								height: 0,
							}
				}
				className={cn(
					"overflow-auto",
					lifted && "z-50",
					// during a drag every body goes inert so elementsFromPoint
					// can reach the slots underneath
					shown && !dragging && "pointer-events-auto",
				)}
			>
				<WorkbenchPanelBody
					record={record}
					component={component}
					panel={panel}
					onReady={handleReady}
					onError={handleError}
				/>
			</div>
		);
	},
);

WorkbenchPanelHost.displayName = "WorkbenchPanelHost";
