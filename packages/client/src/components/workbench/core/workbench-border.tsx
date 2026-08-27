import { type FC, type ReactNode, useCallback } from "react";
import { cn, Separator } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type { WorkbenchSide } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "./workbench.chrome";
import type {
	WorkbenchBorderSlot,
	WorkbenchBorderSlotCtx,
} from "./workbench.types";
import { WorkbenchPanelContextMenu } from "./workbench-context-menu";
import {
	WorkbenchPanelControls,
	WorkbenchPanelHeaderContent,
} from "./workbench-panel-header";
import { WorkbenchResizer } from "./workbench-resizer";
import { WorkbenchTab } from "./workbench-tab";

/**
 * The open border body and its rail icon square off where they meet, so the
 * panel reads as an extension of the button that opened it.
 */
const BODY_ROUND: Record<WorkbenchSide, string> = {
	left: "rounded-r-lg border-l-0",
	right: "rounded-l-lg border-r-0",
	top: "rounded-b-lg border-t-0",
	bottom: "rounded-t-lg border-b-0",
};
/**
 * The corners a side's body slot rounds, mirroring `BODY_ROUND`. The panel
 * fills the card, so its body takes the same pair — the card cannot clip a body
 * that is drawn in the overlay.
 *
 * A header row takes the card's top edge, so a headed panel keeps only the
 * rounded corners that sit below it: on a `bottom` border, where both of the
 * card's curves are up top, that leaves the slot square.
 *
 * @param side - The border edge this body sits on.
 * @param headed - Whether the shell drew its header row over the slot.
 * @return The corners to hand `slotRadius`.
 */
const bodyCorners = (
	side: WorkbenchSide,
	headed: boolean,
): Parameters<typeof WORKBENCH_STYLES.slotRadius>[0] => {
	switch (side) {
		case "left":
			return { tr: !headed, br: true };
		case "right":
			return { tl: !headed, bl: true };
		case "top":
			return { br: true, bl: true };
		default:
			return { tl: !headed, tr: !headed };
	}
};
const RAIL_ROUND: Record<WorkbenchSide, string> = {
	left: "rounded-l-lg",
	right: "rounded-r-lg",
	top: "rounded-t-lg",
	bottom: "rounded-b-lg",
};

export interface WorkbenchBorderProps {
	side: WorkbenchSide;
	slots?: { before?: WorkbenchBorderSlot; after?: WorkbenchBorderSlot };
}

/** External rail content: a node as-is, or a function of the border's state. */
export const resolveBorderSlot = (
	slot: WorkbenchBorderSlot | undefined,
	ctx: WorkbenchBorderSlotCtx,
): ReactNode => (typeof slot === "function" ? slot(ctx) : slot);

/** One border edge: its icon rail, and the open panel body when expanded. */
export const WorkbenchBorder: FC<WorkbenchBorderProps> = ({ side, slots }) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const border = useWorkbench((s) => s.layout.borders[side]);
	const openRecord = useWorkbench((s) => {
		const pid = s.layout.borders[side].activeId;
		return pid ? s.layout.panels[pid] : undefined;
	});
	// Whether the open panel takes the shell's header row. Also read above the
	// early return, for the same hook-order reason as `bodyRef`.
	const headerEnabled = useWorkbench((s) => {
		const pid = s.layout.borders[side].activeId;
		const type = pid ? s.layout.panels[pid]?.type : undefined;
		return type
			? s.layout.components[type]?.enableBorderHeader !== false
			: false;
	});
	// stable, and declared before the early return below so the hook order
	// holds when a border renders nothing
	const bodyRef = useCallback(
		(el: HTMLDivElement | null) => {
			actions.registerSlotElement(`border:${side}`, el);
		},
		[actions, side],
	);

	// A rail carrying slot content still renders with no panels — panels can
	// be dragged out of a border, and the slot must not leave with them.
	if (!border.panelIds.length && !slots?.before && !slots?.after) {
		return null;
	}

	const vertical = side === "left" || side === "right";
	const leading = side === "left" || side === "top";
	const openPid = openRecord?.id ?? null;
	const headed = Boolean(openPid) && headerEnabled;
	const railStack = { kind: "border" as const, id: side };

	const ctx: WorkbenchBorderSlotCtx = {
		side,
		vertical,
		open: Boolean(openPid),
		panelIds: border.panelIds,
	};
	const before = resolveBorderSlot(slots?.before, ctx);
	const after = resolveBorderSlot(slots?.after, ctx);

	const slotDivider = (
		<Separator
			orientation={vertical ? "horizontal" : "vertical"}
			className={cn("flex-none", vertical ? "my-0.5 w-5" : "mx-0.5 h-5")}
		/>
	);

	// Slot content stacks along the rail it sits in — down a left/right rail,
	// across a top/bottom one — so a host can hand over a bare fragment of
	// buttons without knowing which edge it landed on. `self-stretch` gives
	// the box the rail's cross-axis extent, so `items-center` lines the
	// content up with the panel icons above it.
	const slotBox = cn(
		"flex flex-none items-center justify-center gap-1",
		vertical ? "flex-col self-stretch" : "flex-row",
	);

	const rail = (
		<div
			key="rail"
			data-rail={side}
			className={cn(
				"flex flex-none items-center gap-1 border border-border bg-card",
				WORKBENCH_STYLES.railPadding,
				vertical
					? cn(WORKBENCH_STYLES.railThickness.vertical, "flex-col")
					: cn(WORKBENCH_STYLES.railThickness.horizontal, "flex-row"),
				openPid ? RAIL_ROUND[side] : "rounded-lg",
			)}
		>
			{before && (
				<>
					<div className={slotBox}>{before}</div>
					{slotDivider}
				</>
			)}
			<div
				role="tablist"
				aria-label="Panels"
				aria-orientation={vertical ? "vertical" : "horizontal"}
				className={cn(
					"flex min-h-0 min-w-0 flex-1 items-center justify-start gap-1",
					vertical
						? "flex-col self-stretch overflow-y-auto overflow-x-hidden"
						: "flex-row overflow-x-auto",
				)}
			>
				{border.panelIds.map((pid) => (
					<WorkbenchTab
						key={pid}
						pid={pid}
						stack={railStack}
						active={border.activeId === pid}
						location={vertical ? "rail-vertical" : "rail"}
					/>
				))}
			</div>
			{after && (
				<>
					{slotDivider}
					<div className={slotBox}>{after}</div>
				</>
			)}
		</div>
	);

	const body = openPid && (
		<div
			key="body"
			style={vertical ? { width: border.size } : { height: border.size }}
			className={cn(
				"flex min-h-0 min-w-0 flex-col overflow-hidden border border-border bg-card",
				BODY_ROUND[side],
			)}
		>
			{/* What a docked panel gets from its tab strip. A border has no
			    strip, and its rail is one `chromeButton` wide — too narrow for
			    anything but a glyph, and a row of navigation icons besides — so
			    the panel's label and its control sit here instead, over the
			    body they belong to. The rail tab still carries the toggle,
			    rename, close, and context menu. */}
			{headed && (
				<WorkbenchPanelContextMenu pid={openPid}>
					<div
						data-border-header={side}
						className={cn(
							"flex min-w-0 flex-none items-center gap-1 border-border border-b bg-card px-2",
							WORKBENCH_STYLES.borderHeader,
						)}
					>
						<div className="flex min-w-0 flex-1 items-center gap-1.5 text-muted-foreground text-xs">
							<WorkbenchPanelHeaderContent
								pid={openPid}
								location="header"
							/>
						</div>
						<WorkbenchPanelControls
							pid={openPid}
							location="header"
						/>
					</div>
				</WorkbenchPanelContextMenu>
			)}
			<div
				ref={bodyRef}
				data-radius={WORKBENCH_STYLES.slotRadius(
					bodyCorners(side, headed),
				)}
				className="relative min-h-0 flex-1"
			/>
		</div>
	);

	const resizer = openPid && (
		<WorkbenchResizer key="resizer" kind="border" side={side} />
	);

	const parts = leading ? [rail, body, resizer] : [resizer, body, rail];

	return (
		<div
			data-border={side}
			data-testid={`workbench-border-${side}`}
			// relative: the resize handle is positioned into the shell gap
			// alongside this border rather than taking a slice of its width
			className={cn(
				"relative flex flex-none",
				vertical ? "flex-row" : "flex-col",
			)}
		>
			{parts}
		</div>
	);
};
