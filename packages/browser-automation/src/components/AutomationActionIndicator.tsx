import type React from "react";
import { Spinner } from "@semoss/ui/next";

interface AutomationActionIndicatorProps {
	/** Position in pixels relative to the browser canvas container. */
	localX: number;
	localY: number;
}

/**
 * Floating overlay that appears near a click in automation mode.
 * Positioned absolutely inside the browser canvas container.
 */
export const AutomationActionIndicator: React.FC<
	AutomationActionIndicatorProps
> = ({ localX, localY }) => {
	// Anchor below-right of the click, with enough room to not clip the edge.
	const POPUP_WIDTH = 220;
	const POPUP_HEIGHT = 60;
	const OFFSET_X = 12;
	const OFFSET_Y = 12;

	// We don't know the container size here, so we just position and let the
	// parent clip via overflow-hidden if needed.
	const left = localX + OFFSET_X;
	const top = localY + OFFSET_Y;

	return (
		<div
			className="absolute z-30 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 shadow-lg"
			style={{
				left,
				top,
				width: POPUP_WIDTH,
				minHeight: POPUP_HEIGHT,
				pointerEvents: "auto",
			}}
		>
			<Spinner className="h-4 w-4 shrink-0 text-accent" />
			<span className="text-ink-muted text-xs">Generating…</span>
		</div>
	);
};
