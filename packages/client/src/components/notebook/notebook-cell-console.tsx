import { useMemo } from "react";
import { hasInlineImage, InlineImageSegments } from "@semoss/shared";
import {
	countExpandedJsonLines,
	JSON_VIEWER_LINE_HEIGHT_PX,
	JsonValueViewer,
} from "@/components/common/json-value-viewer";
import { isOutputJSON } from "@/utility/general";

interface ConsoleProps {
	/**
	 * Messages for each Cell
	 */
	messages: string[];
	/** Controlled expand-all state forwarded to embedded JSON viewers. */
	expandAll?: boolean;
	/** Hide each JSON viewer's built-in expand-all toggle. */
	hideJsonToggle?: boolean;
	/**
	 * Reserve a stable height for the whole list, equal to the sum of every
	 * entry's fully-expanded layout (capped at 60vh). Individual JSON viewers
	 * inside grow naturally — collapsing one leaves empty space at the bottom
	 * of the list rather than between entries.
	 */
	fixedHeight?: boolean;
	/**
	 * Height cap applied to inline images. Defaults to a small preview that
	 * fits the collapsed console; the expand modal passes `max-h-none`.
	 */
	imageClassName?: string;
}

export const NotebookCellConsole = (props: ConsoleProps) => {
	const {
		messages,
		expandAll,
		hideJsonToggle,
		fixedHeight,
		imageClassName = "max-h-[180px]",
	} = props;
	const gutterChars = String(messages.length).length;

	const fullyOpenHeightPx = useMemo(() => {
		if (!fixedHeight) return undefined;
		const totalLines = messages.reduce((acc, m) => {
			const value = isOutputJSON(m);
			return acc + (value != null ? countExpandedJsonLines(value) : 1);
		}, 0);
		return Math.ceil(totalLines * JSON_VIEWER_LINE_HEIGHT_PX);
	}, [messages, fixedHeight]);

	return (
		<div
			className="flex flex-col"
			style={
				fullyOpenHeightPx !== undefined
					? { height: `min(60vh, ${fullyOpenHeightPx}px)` }
					: undefined
			}
		>
			{messages.map((m, i) => {
				const value = isOutputJSON(m);
				return (
					<div key={`${i}-${m}`} className="flex items-start gap-2">
						<span
							aria-hidden="true"
							className="select-none pt-px text-right font-mono text-[11px] text-muted-foreground/70 tabular-nums"
							style={{ minWidth: `${gutterChars}ch` }}
						>
							{i + 1}
						</span>
						<div className="min-w-0 flex-1">
							{value != null ? (
								<JsonValueViewer
									value={value}
									expandAll={expandAll}
									hideToggle={hideJsonToggle}
								/>
							) : hasInlineImage(m) ? (
								// Figures land on the log channel when an
								// execution raised or returned a non-text value.
								<InlineImageSegments
									text={m}
									textClassName="whitespace-pre-wrap break-all text-xs"
									imageClassName={imageClassName}
								/>
							) : (
								<span className="text-xs">{m}</span>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};
