import type { Node, NodeChange } from "@xyflow/react";
import { useCallback, useState } from "react";
import { getHelperLines, type HelperLine } from "./helper-lines";

/** Guides currently shown on the canvas. */
export interface ActiveHelperLines {
	vertical?: HelperLine;
	horizontal?: HelperLine;
}

/** Return contract of {@link useHelperLines}. */
export interface UseHelperLinesResult {
	/** Guides to render while a single node is being dragged. */
	lines: ActiveHelperLines;
	/**
	 * Snaps a single-node drag to nearby alignment guides and updates `lines`.
	 * Returns the changes unchanged for anything other than a one-node drag.
	 */
	applyHelperLines: (changes: NodeChange[], nodes: Node[]) => NodeChange[];
	/** Hides all guides. */
	clearHelperLines: () => void;
}

const NO_LINES: ActiveHelperLines = {};

function isSameLine(a?: HelperLine, b?: HelperLine): boolean {
	if (!a || !b) return a === b;
	return a.position === b.position && a.start === b.start && a.end === b.end;
}

/**
 * Alignment guides for dragging nodes on a React Flow canvas.
 *
 * Feed node changes through `applyHelperLines` before handing them to the
 * flow's change handler so the dragged node snaps onto the guides.
 */
export function useHelperLines(): UseHelperLinesResult {
	const [lines, setLines] = useState<ActiveHelperLines>(NO_LINES);

	const updateLines = useCallback((next: ActiveHelperLines) => {
		setLines((previous) =>
			isSameLine(previous.vertical, next.vertical) &&
			isSameLine(previous.horizontal, next.horizontal)
				? previous
				: next,
		);
	}, []);

	const clearHelperLines = useCallback(
		() => updateLines(NO_LINES),
		[updateLines],
	);

	const applyHelperLines = useCallback(
		(changes: NodeChange[], nodes: Node[]): NodeChange[] => {
			const positionChanges = changes.filter(
				(change) => change.type === "position",
			);
			const [dragChange] = positionChanges;
			if (
				positionChanges.length !== 1 ||
				dragChange?.type !== "position" ||
				!dragChange.dragging ||
				!dragChange.position
			) {
				if (positionChanges.some((change) => !change.dragging)) {
					updateLines(NO_LINES);
				}
				return changes;
			}

			const result = getHelperLines(
				dragChange.id,
				dragChange.position,
				nodes,
			);
			updateLines({
				vertical: result.vertical,
				horizontal: result.horizontal,
			});
			if (result.x === undefined && result.y === undefined)
				return changes;

			const snappedPosition = {
				x: result.x ?? dragChange.position.x,
				y: result.y ?? dragChange.position.y,
			};
			return changes.map((change) =>
				change === dragChange
					? { ...dragChange, position: snappedPosition }
					: change,
			);
		},
		[updateLines],
	);

	return { lines, applyHelperLines, clearHelperLines };
}
