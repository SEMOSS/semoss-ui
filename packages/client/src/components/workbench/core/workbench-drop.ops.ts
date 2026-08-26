import type { WorkbenchRect, WorkbenchSide } from "@/stores/workbench";
import type { WorkbenchDropInfo } from "./workbench.types";

/** How far a drop zone reaches in from the stage edge for border targets. */
export const WORKBENCH_EDGE_BAND = 56;

/**
 * How deep the split zones reach into a dock. Generous on any dock big
 * enough to take it, never past 40% of the short side so the middle stays
 * reachable on a small one.
 */
const SPLIT_ZONE = { min: 64, max: 180, share: 0.35 };

/**
 * The split-zone depth for a dock body of the given size.
 *
 * @param rect - The dock body rect.
 * @return Depth in px that resolves to a split rather than a join.
 */
export function splitZone(rect: WorkbenchRect | DOMRect): number {
	const span = Math.min(rect.width, rect.height);
	const wanted = Math.min(
		Math.max(span * SPLIT_ZONE.share, SPLIT_ZONE.min),
		SPLIT_ZONE.max,
	);
	return Math.min(wanted, span * 0.4);
}

/**
 * The highlight rect a resolved drop should draw.
 *
 * @param drop - The resolved drop info.
 * @return The ghost rect — half the target for splits, the caret for strips.
 */
export function ghostRect({ rect, zone }: WorkbenchDropInfo): WorkbenchRect {
	const base = {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
	};
	if (zone === "strip") {
		return base;
	}
	if (zone === "left") {
		return { ...base, width: base.width / 2 };
	}
	if (zone === "right") {
		return {
			...base,
			left: base.left + base.width / 2,
			width: base.width / 2,
		};
	}
	if (zone === "top") {
		return { ...base, height: base.height / 2 };
	}
	if (zone === "bottom") {
		return {
			...base,
			top: base.top + base.height / 2,
			height: base.height / 2,
		};
	}
	return base;
}

/**
 * The insertion index a pointer position resolves to within a strip of
 * item rects.
 *
 * @param rects - The item rects, in strip order.
 * @param x - Pointer x.
 * @param y - Pointer y.
 * @param vertical - Whether the strip flows vertically.
 * @return The index the dragged item would land at.
 */
export function resolveInsertionIndex(
	rects: DOMRect[],
	x: number,
	y: number,
	vertical: boolean,
): number {
	const index = rects.findIndex((rect) =>
		vertical
			? y < rect.top + rect.height / 2
			: x < rect.left + rect.width / 2,
	);
	return index === -1 ? rects.length : index;
}

/**
 * Which side of the stage a pointer outside it has crossed furthest into,
 * so a corner resolves to one answer.
 *
 * @param stage - The stage rect.
 * @param x - Pointer x.
 * @param y - Pointer y.
 * @return The crossed side, or null when the pointer is inside the stage.
 */
export function resolveOutsideSide(
	stage: DOMRect,
	x: number,
	y: number,
): WorkbenchSide | null {
	const outside: [WorkbenchSide, number][] = (
		[
			["left", stage.left - x],
			["right", x - stage.right],
			["top", stage.top - y],
			["bottom", y - stage.bottom],
		] as [WorkbenchSide, number][]
	).filter(([, distance]) => distance > 0);
	if (!outside.length) {
		return null;
	}
	return outside.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}

/**
 * Which empty-border edge a pointer inside the stage is hugging, if any.
 *
 * @param stage - The stage rect.
 * @param x - Pointer x.
 * @param y - Pointer y.
 * @param isEmpty - Whether a side's border currently has no panels.
 * @return The hugged side, or null.
 */
export function resolveHuggingSide(
	stage: DOMRect,
	x: number,
	y: number,
	isEmpty: (side: WorkbenchSide) => boolean,
): WorkbenchSide | null {
	const hugging: [WorkbenchSide, number][] = (
		[
			["left", x - stage.left],
			["right", stage.right - x],
			["top", y - stage.top],
			["bottom", stage.bottom - y],
		] as [WorkbenchSide, number][]
	).filter(
		([side, distance]) =>
			distance >= 0 && distance < WORKBENCH_EDGE_BAND && isEmpty(side),
	);
	if (!hugging.length) {
		return null;
	}
	return hugging.reduce((best, cur) => (cur[1] < best[1] ? cur : best))[0];
}

/**
 * The band rect drawn at a stage edge when a border side has no body yet.
 *
 * @param side - The border side.
 * @param stage - The stage rect.
 * @return The band rect in viewport coordinates.
 */
export function edgeBandRect(
	side: WorkbenchSide,
	stage: DOMRect,
): WorkbenchRect {
	if (side === "left") {
		return {
			left: stage.left,
			top: stage.top,
			width: WORKBENCH_EDGE_BAND,
			height: stage.height,
		};
	}
	if (side === "right") {
		return {
			left: stage.right - WORKBENCH_EDGE_BAND,
			top: stage.top,
			width: WORKBENCH_EDGE_BAND,
			height: stage.height,
		};
	}
	if (side === "top") {
		return {
			left: stage.left,
			top: stage.top,
			width: stage.width,
			height: WORKBENCH_EDGE_BAND,
		};
	}
	return {
		left: stage.left,
		top: stage.bottom - WORKBENCH_EDGE_BAND,
		width: stage.width,
		height: WORKBENCH_EDGE_BAND,
	};
}
