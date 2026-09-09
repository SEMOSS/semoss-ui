import { type RefObject, useCallback } from "react";
import { useWorkbenchStoreApi } from "@/hooks";
import { findTabset, type WorkbenchSide } from "@/stores/workbench";
import type { WorkbenchDropInfo } from "./workbench.types";
import {
	edgeBandRect,
	resolveHuggingSide,
	resolveInsertionIndex,
	resolveOutsideSide,
	splitZone,
} from "./workbench-drop.ops";

/**
 * Resolve a pointer position to the one drop it means.
 *
 * Shared by both drag mechanisms the shell supports — the pointer-event drag
 * of an existing tab, and a native HTML5 drag from outside the dock — so a
 * dropped file lands with exactly the same geometry as a dragged tab.
 *
 * Resolution is geometric and ordered, and always yields at most one target:
 *   1. a rail icon       → reorder inside that border
 *   2. a tab strip       → insert at a position in that dock
 *   3. a border region   → dock into that border
 *   4. outside the stage → the border side crossed furthest into
 *   5. hugging an empty edge → create that border
 *   6. a dock body       → split it, or join it in the middle
 *
 * @param stageRef - The stage element edge bands and outside-crossings
 * resolve against.
 * @return A hit-test callback; it returns null when nothing is droppable.
 */
export const useWorkbenchHitTest = (
	stageRef: RefObject<HTMLDivElement | null>,
) => {
	const storeApi = useWorkbenchStoreApi();

	return useCallback(
		(x: number, y: number): WorkbenchDropInfo | null => {
			const state = storeApi.getState();
			const elements: Element[] =
				typeof document.elementsFromPoint === "function"
					? document.elementsFromPoint(x, y)
					: [];

			const pick = (selector: string): Element | null => {
				for (const el of elements) {
					const hit = el.closest(selector);
					if (hit) {
						return hit;
					}
				}
				return null;
			};

			// 1. the rail picks an insertion slot, so border icons can reorder
			const rail = pick("[data-rail]");
			if (rail) {
				const side = rail.getAttribute("data-rail") as WorkbenchSide;
				const vertical = side === "left" || side === "right";
				const railRect = rail.getBoundingClientRect();
				const rects = Array.from(
					rail.querySelectorAll("[data-tab]"),
				).map((el) => el.getBoundingClientRect());
				const index = resolveInsertionIndex(rects, x, y, vertical);
				const last = rects[rects.length - 1];
				const at =
					index < rects.length
						? vertical
							? rects[index].top
							: rects[index].left
						: last
							? vertical
								? last.bottom
								: last.right
							: vertical
								? railRect.top + 4
								: railRect.left + 4;
				return {
					target: { kind: "border", side, index },
					rect: vertical
						? {
								left: railRect.left + 6,
								top: at - 1.5,
								width: railRect.width - 12,
								height: 3,
							}
						: {
								left: at - 1.5,
								top: railRect.top + 6,
								width: 3,
								height: railRect.height - 12,
							},
					zone: "strip",
				};
			}

			// 2. a tab strip always inserts — it is the most precise target
			//    there is, and it must never be shadowed by an edge zone
			const strip = pick("[data-tabstrip]");
			if (strip) {
				const stripId = strip.getAttribute("data-tabstrip") ?? "";
				if (
					findTabset(state.layout.tree, stripId)?.enableDrop === false
				) {
					return null;
				}
				const stripRect = strip.getBoundingClientRect();
				const rects = Array.from(
					strip.querySelectorAll("[data-tab]"),
				).map((el) => el.getBoundingClientRect());
				const index = resolveInsertionIndex(rects, x, y, false);
				const caret =
					index < rects.length
						? rects[index].left
						: rects.length
							? rects[rects.length - 1].right
							: stripRect.left + 6;
				return {
					target: { kind: "join", tabsetId: stripId, index },
					rect: {
						left: caret - 1.5,
						top: stripRect.top + 4,
						width: 3,
						height: stripRect.height - 8,
					},
					zone: "strip",
				};
			}

			const stage = stageRef.current?.getBoundingClientRect();

			// 3. anywhere in a border — its rail or its open panel
			const borderEl = pick("[data-border]");
			if (borderEl) {
				const side = borderEl.getAttribute(
					"data-border",
				) as WorkbenchSide;
				const rect = borderEl.getBoundingClientRect();
				return {
					target: { kind: "border", side },
					rect: {
						left: rect.left,
						top: rect.top,
						width: rect.width,
						height: rect.height,
					},
					zone: "center",
				};
			}

			if (stage) {
				// 4. past the edge of the stage: whichever side is crossed
				//    furthest, so a corner resolves to one answer
				const outside = resolveOutsideSide(stage, x, y);
				if (outside) {
					return {
						target: { kind: "border", side: outside },
						rect: edgeBandRect(outside, stage),
						zone: "center",
					};
				}

				// 5. hugging an edge that has no border yet — the only case
				//    where a drop zone reaches into the stage
				const hugging = resolveHuggingSide(
					stage,
					x,
					y,
					(side) => state.layout.borders[side].panelIds.length === 0,
				);
				if (hugging) {
					return {
						target: { kind: "border", side: hugging },
						rect: edgeBandRect(hugging, stage),
						zone: "center",
					};
				}
			}

			// 6. a dock body. Zones are measured against the body, not the
			//    whole card, so the tab strip stays visible and untouched.
			const body = pick("[data-body]");
			if (!body) {
				return null;
			}
			const tabsetId = body.getAttribute("data-body") ?? "";
			if (findTabset(state.layout.tree, tabsetId)?.enableDrop === false) {
				return null;
			}
			const bounds = body.getBoundingClientRect();
			const rect = {
				left: bounds.left,
				top: bounds.top,
				width: bounds.width,
				height: bounds.height,
			};
			const distances: [WorkbenchSide, number][] = [
				["left", x - bounds.left],
				["right", bounds.right - x],
				["top", y - bounds.top],
				["bottom", bounds.bottom - y],
			];
			distances.sort((a, b) => a[1] - b[1]);
			const [dir, dist] = distances[0];
			if (dist < splitZone(rect)) {
				return {
					target: { kind: "split", tabsetId, dir },
					rect,
					zone: dir,
				};
			}
			return {
				target: { kind: "join", tabsetId },
				rect,
				zone: "center",
			};
		},
		[storeApi, stageRef],
	);
};
