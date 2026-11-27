import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import {
	type DragEvent,
	type KeyboardEvent,
	type ReactNode,
	useRef,
} from "react";

/** Props for {@link FileExplorerRootRow}. */
interface FileExplorerRootRowProps {
	name: string;
	/** The host's buttons for the root, shown as a tree row's menu is. */
	actions?: ReactNode;
	isExpanded: boolean;
	onToggle: () => void;
	/** Go into the root, so it fills the explorer as a folder does. */
	onEnter: () => void;
	/** The id of the element the row shows and hides. */
	controls: string;
	onDragStart: (e: DragEvent<HTMLDivElement>) => void;
	onDragEnd: () => void;
	/**
	 * Move the root one place, from Alt+Up or Alt+Down on the row.
	 *
	 * @param offset - -1 for up, 1 for down.
	 */
	onMove: (offset: -1 | 1) => void;
}

/** Two clicks this close together are a double-click, as in the tree. */
const DOUBLE_CLICK_MS = 400;

/**
 * A root of a file explorer at its top level, drawn exactly as a folder row of
 * the tree (`TreeViewItem` with a `FileExplorerItem` label): the same height,
 * padding, chevron, name, and a menu column that shows on hover. A click opens
 * or closes it in place, a double-click or Enter goes into it, the arrow keys
 * open and close it, and a drag (or Alt+Up and Alt+Down) moves it.
 *
 * @param props - The root's name, state, and actions.
 * @returns The row.
 */
export const FileExplorerRootRow = ({
	name,
	actions,
	isExpanded,
	onToggle,
	onEnter,
	controls,
	onDragStart,
	onDragEnd,
	onMove,
}: FileExplorerRootRowProps) => {
	const lastClick = useRef(0);

	// a double-click goes in, in place of its second click's toggle
	const handleClick = () => {
		const now = Date.now();
		const isDoubleClick = now - lastClick.current < DOUBLE_CLICK_MS;
		lastClick.current = isDoubleClick ? 0 : now;
		if (isDoubleClick) {
			onEnter();
			return;
		}
		onToggle();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
			e.preventDefault();
			onMove(e.key === "ArrowUp" ? -1 : 1);
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			onEnter();
			return;
		}
		if (
			(e.key === "ArrowRight" && !isExpanded) ||
			(e.key === "ArrowLeft" && isExpanded)
		) {
			e.preventDefault();
			onToggle();
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: the drag is a pointer shortcut; the toggle's Alt+Up and Alt+Down move the root from the keyboard
		<div
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			data-testid="file-explorer-root-row"
			// the tree's row: `TreeViewItem`'s padding at depth 0 and its own end
			// padding, plus its label's (`FileExplorerItem`'s `pe-2`), so the
			// menu column ends where a folder row's does
			className="group flex w-full items-center gap-1 rounded-md py-1 ps-2 pe-4 transition-colors hover:bg-muted"
		>
			<button
				type="button"
				aria-expanded={isExpanded}
				aria-controls={controls}
				aria-keyshortcuts="Enter Alt+ArrowUp Alt+ArrowDown"
				data-root-toggle
				title={name}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				className="flex min-h-7 min-w-0 flex-1 items-center gap-1 rounded text-start text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<span
					aria-hidden
					className="flex size-4 shrink-0 items-center justify-center"
				>
					{isExpanded ? (
						<ChevronDownIcon className="size-4" />
					) : (
						<ChevronRightIcon className="rtl:-scale-x-100 size-4" />
					)}
				</span>
				<span className="min-w-0 truncate pe-2">{name}</span>
			</button>
			{actions ? (
				// the tree row's menu column: as wide, and shown the same way
				<div className="flex w-7 shrink-0 items-center justify-end opacity-0 pointer-coarse:opacity-100 focus-within:opacity-100 group-hover:opacity-100 has-[[data-state=open]]:opacity-100">
					{actions}
				</div>
			) : null}
		</div>
	);
};
