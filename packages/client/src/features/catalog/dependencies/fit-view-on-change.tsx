import {
	getViewportForBounds,
	type ReactFlowState,
	type Rect,
	useReactFlow,
	useStore,
} from "@xyflow/react";
import { useEffect } from "react";

/**
 * How the Ontology canvas fits what it shows: the share of the canvas left
 * around it, and the closest it zooms in, so a small graph is not blown up.
 */
export const FIT_VIEW_OPTIONS = { padding: 0.2, maxZoom: 1 } as const;

/** The furthest the Ontology canvas zooms out. */
export const MIN_ZOOM = 0.1;

/** Props for {@link FitViewOnChange}. */
interface FitViewOnChangeProps {
	/** The area every item shown covers, in canvas units */
	bounds: Rect;
}

const selectWidth = (state: ReactFlowState): number => state.width;
const selectHeight = (state: ReactFlowState): number => state.height;

/**
 * Fits a React Flow canvas to the area its items cover whenever that area or
 * the canvas's size changes. The area comes from the caller, who placed the
 * items, so the fit does not wait on React Flow measuring them. Renders
 * nothing; mount it inside `ReactFlow`.
 */
export const FitViewOnChange = ({ bounds }: FitViewOnChangeProps) => {
	const { setViewport } = useReactFlow();
	const canvasWidth = useStore(selectWidth);
	const canvasHeight = useStore(selectHeight);
	const { x, y, width, height } = bounds;
	useEffect(() => {
		if (!canvasWidth || !canvasHeight || width <= 0 || height <= 0) {
			return;
		}
		const viewport = getViewportForBounds(
			{ x, y, width, height },
			canvasWidth,
			canvasHeight,
			MIN_ZOOM,
			FIT_VIEW_OPTIONS.maxZoom,
			FIT_VIEW_OPTIONS.padding,
		);
		void setViewport(viewport, { duration: 300 });
	}, [setViewport, canvasWidth, canvasHeight, x, y, width, height]);
	return null;
};
