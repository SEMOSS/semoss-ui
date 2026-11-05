import { useStore, ViewportPortal } from "@xyflow/react";
import type { ActiveHelperLines } from "./use-helper-lines";

/** Props for {@link HelperLinesOverlay}. */
export interface HelperLinesOverlayProps {
	/** Guides to draw, in flow coordinates. */
	lines: ActiveHelperLines;
}

/** Draws alignment guides inside the React Flow viewport. */
export function HelperLinesOverlay({ lines }: HelperLinesOverlayProps) {
	const zoom = useStore((state) => state.transform[2]);
	const { vertical, horizontal } = lines;
	if (!vertical && !horizontal) return null;

	return (
		<ViewportPortal>
			<svg
				aria-hidden="true"
				width={1}
				height={1}
				className="pointer-events-none absolute top-0 left-0 overflow-visible"
			>
				{vertical ? (
					<line
						x1={vertical.position}
						x2={vertical.position}
						y1={vertical.start}
						y2={vertical.end}
						strokeWidth={1 / zoom}
						strokeDasharray={`${4 / zoom} ${3 / zoom}`}
						className="stroke-primary"
					/>
				) : null}
				{horizontal ? (
					<line
						x1={horizontal.start}
						x2={horizontal.end}
						y1={horizontal.position}
						y2={horizontal.position}
						strokeWidth={1 / zoom}
						strokeDasharray={`${4 / zoom} ${3 / zoom}`}
						className="stroke-primary"
					/>
				) : null}
			</svg>
		</ViewportPortal>
	);
}
