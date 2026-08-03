import { Wand2, X } from "lucide-react";
import type React from "react";
import { Button, Spinner } from "@semoss/ui/next";

interface AutomationPopupProps {
	/** Position in pixels relative to the browser canvas container. */
	localX: number;
	localY: number;
	/** Whether the LLM call is in flight. */
	isGenerating: boolean;
	onGenerate: () => void;
	onDismiss: () => void;
}

/**
 * Floating overlay that appears near a click in automation mode.
 * Positioned absolutely inside the browser canvas container.
 */
export const AutomationPopup: React.FC<AutomationPopupProps> = ({
	localX,
	localY,
	isGenerating,
	onGenerate,
	onDismiss,
}) => {
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
			{isGenerating ? (
				<>
					<Spinner className="h-4 w-4 shrink-0 text-accent" />
					<span className="text-ink-muted text-xs">Generating…</span>
				</>
			) : (
				<>
					<Wand2 className="h-4 w-4 shrink-0 text-accent" />
					<Button
						size="sm"
						variant="ghost"
						className="h-auto flex-1 justify-start p-0 text-xs hover:bg-transparent hover:text-accent"
						onClick={onGenerate}
					>
						Fill from context
					</Button>
					<Button
						size="icon-sm"
						variant="ghost"
						className="h-5 w-5 shrink-0 text-ink-muted hover:text-ink"
						onClick={onDismiss}
						aria-label="Dismiss"
					>
						<X className="h-3 w-3" />
					</Button>
				</>
			)}
		</div>
	);
};
