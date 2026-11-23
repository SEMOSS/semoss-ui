import type { Viewport } from "@xyflow/react";
import { type RefObject, useCallback, useEffect, useState } from "react";

/** What {@link useExpandableCanvas} gives a graph page. */
export interface UseExpandableCanvasResult {
	/** Whether the graph fills the window */
	readonly isExpanded: boolean;
	/**
	 * Where the canvas starts after it moves in or out of the expanded view,
	 * so the user keeps their place; undefined fits the graph
	 */
	readonly startViewport: Viewport | undefined;
	/** Expands the graph, or collapses it back into the page */
	readonly toggle: () => void;
	/** Collapses the graph back into the page */
	readonly collapse: () => void;
}

/**
 * Lets a graph page fill the window: the page shows its graph, toolbar and
 * drawer in a full-window dialog and asks the browser for full screen too
 * (the window is used when the browser refuses). Leaving the browser's full
 * screen, such as with Escape, collapses it. The canvas remounts on each move,
 * so the viewport is kept across it. The admin Ontology and the Ontology tab
 * share it.
 *
 * @param flowRef - The canvas's React Flow instance, for its viewport.
 * @returns Whether it is expanded, where the canvas starts, and the toggles.
 */
export const useExpandableCanvas = (
	flowRef: RefObject<{ getViewport: () => Viewport } | null>,
): UseExpandableCanvasResult => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [startViewport, setStartViewport] = useState<Viewport | undefined>();

	const collapse = useCallback((): void => {
		setStartViewport(flowRef.current?.getViewport());
		setIsExpanded(false);
		if (document.fullscreenElement) {
			void document.exitFullscreen();
		}
	}, [flowRef]);

	const toggle = useCallback((): void => {
		if (isExpanded) {
			collapse();
			return;
		}
		setStartViewport(flowRef.current?.getViewport());
		setIsExpanded(true);
		// take the whole screen too; the window is used when the browser refuses
		document.documentElement.requestFullscreen?.().catch(() => undefined);
	}, [collapse, flowRef, isExpanded]);

	// leaving the browser's full screen, such as with Escape, collapses it
	useEffect(() => {
		if (!isExpanded) {
			return;
		}
		const handleChange = (): void => {
			if (!document.fullscreenElement) {
				collapse();
			}
		};
		document.addEventListener("fullscreenchange", handleChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleChange);
	}, [isExpanded, collapse]);

	return { isExpanded, startViewport, toggle, collapse };
};
