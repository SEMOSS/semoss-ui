import { type FC, type ReactNode, useCallback } from "react";
import { cn, Separator } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type { WorkbenchSide } from "@/stores/workbench";
import { RAIL_PADDING, RAIL_THICKNESS, slotRadius } from "./workbench.chrome";
import type {
	WorkbenchBorderSlot,
	WorkbenchBorderSlotCtx,
} from "./workbench.types";
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
 * The corners each side's body card rounds, mirroring `BODY_ROUND`. The panel
 * fills the card, so its body takes the same pair — the card cannot clip a body
 * that is drawn in the overlay.
 */
const BODY_CORNERS: Record<WorkbenchSide, Parameters<typeof slotRadius>[0]> = {
	left: { tr: true, br: true },
	right: { tl: true, bl: true },
	top: { br: true, bl: true },
	bottom: { tl: true, tr: true },
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
				RAIL_PADDING,
				vertical
					? cn(RAIL_THICKNESS.vertical, "flex-col")
					: cn(RAIL_THICKNESS.horizontal, "flex-row"),
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
			{/* the panel draws its own heading; the rail tab carries the
			    toggle, rename, close, and context menu */}
			<div
				ref={bodyRef}
				data-radius={slotRadius(BODY_CORNERS[side])}
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
