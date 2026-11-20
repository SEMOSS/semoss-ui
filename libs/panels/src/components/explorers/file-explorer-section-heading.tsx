import { ChevronRightIcon } from "lucide-react";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { cn } from "@semoss/ui/next";

/** Props for {@link FileExplorerSectionHeading}. */
export interface FileExplorerSectionHeadingProps {
	/** What the section is called. */
	label: string;
	/** Whether the section's contents show. */
	isExpanded: boolean;
	/** Show or hide the section's contents. */
	onToggle: () => void;
	/** A nested section is indented under its group. */
	isNested?: boolean;
	/** Buttons at the heading's end, such as New and Refresh. */
	actions?: ReactNode;
	/** The id of the element the heading shows and hides. */
	controls: string;
	/**
	 * Makes the heading a drag handle that moves its section. Left out, the
	 * section stays where it is.
	 */
	onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
	/** The heading's drag ended, dropped or not. */
	onDragEnd?: () => void;
	/**
	 * Move the section one place, from Alt+Up or Alt+Down on its toggle.
	 *
	 * @param offset - -1 for up, 1 for down.
	 */
	onMove?: (offset: -1 | 1) => void;
}

/**
 * The heading of one section of the Files panel, such as Room Files or one
 * attached folder, which shows and hides what is under it, and, for a section
 * that can move, drags it somewhere else.
 *
 * @param props - The section's label, state, and actions.
 * @returns The heading.
 */
export const FileExplorerSectionHeading = ({
	label,
	isExpanded,
	onToggle,
	isNested = false,
	actions,
	controls,
	onDragStart,
	onDragEnd,
	onMove,
}: FileExplorerSectionHeadingProps) => {
	const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		if (!onMove || !e.altKey) {
			return;
		}

		if (e.key === "ArrowUp" || e.key === "ArrowDown") {
			e.preventDefault();
			onMove(e.key === "ArrowUp" ? -1 : 1);
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: the drag is a pointer shortcut; the toggle's Alt+Up and Alt+Down move the section from the keyboard
		<div
			draggable={Boolean(onDragStart)}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			className={cn(
				"flex h-8 shrink-0 items-center gap-1 border-b pe-1",
				isNested ? "ps-4" : "ps-1",
				onDragStart && "cursor-grab active:cursor-grabbing",
			)}
		>
			<button
				type="button"
				aria-expanded={isExpanded}
				aria-controls={controls}
				aria-keyshortcuts={
					onMove ? "Alt+ArrowUp Alt+ArrowDown" : undefined
				}
				data-section-toggle
				onClick={onToggle}
				onKeyDown={handleKeyDown}
				className="flex h-7 min-w-0 flex-1 items-center gap-1 rounded-sm px-1 text-start font-medium text-muted-foreground text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<ChevronRightIcon
					aria-hidden
					className={cn(
						"size-3 shrink-0 transition-transform motion-reduce:transition-none",
						isExpanded && "rotate-90",
					)}
				/>
				<span className="truncate">{label}</span>
			</button>
			{actions ? (
				<div className="flex shrink-0 items-center gap-0.5">
					{actions}
				</div>
			) : null}
		</div>
	);
};
