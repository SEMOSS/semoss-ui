import { MoreVertical, Pin, X } from "lucide-react";
import {
	type FC,
	type KeyboardEvent,
	memo,
	useCallback,
	useRef,
	useState,
} from "react";
import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type {
	WorkbenchHeaderLocation,
	WorkbenchPanelId,
	WorkbenchSide,
	WorkbenchStack,
} from "@/stores/workbench";
import {
	CHROME_BUTTON,
	CHROME_BUTTON_SM,
	CHROME_ICON,
	CHROME_ICON_SM,
} from "./workbench.chrome";
import { WorkbenchPanelHeaderContent } from "./workbench-panel-header";

export interface WorkbenchTabProps {
	pid: WorkbenchPanelId;
	/** The stack (dock or border) activating this tab targets. */
	stack: Pick<WorkbenchStack, "kind" | "id">;
	active: boolean;
	/**
	 * Where this tab is drawn. `"rail-vertical"` turns it on its side for a
	 * left/right border; the blueprint's own header sees this too.
	 */
	location?: WorkbenchHeaderLocation;
	/** Taller touch targets and an options button, for the mobile strip. */
	compact?: boolean;
}

/**
 * The inline rename input shown in place of a tab or border header. Mounted
 * only while its panel is being edited, so state seeds from the current name.
 */
export const WorkbenchTabRenameInput: FC<{ pid: WorkbenchPanelId }> = ({
	pid,
}) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const name = useWorkbench((s) => s.layout.panels[pid]?.name ?? "");
	const [value, setValue] = useState(name);

	const finish = (save: boolean) => {
		if (save) {
			actions.renamePanel(pid, value);
		}
		actions.setEditingPanel(undefined);
	};

	return (
		<input
			// biome-ignore lint/a11y/noAutofocus: rename input takes focus by design
			autoFocus
			value={value}
			aria-label="Rename panel"
			onChange={(e) => setValue(e.target.value)}
			onPointerDown={(e) => e.stopPropagation()}
			onBlur={() => finish(true)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					finish(true);
				}
				if (e.key === "Escape") {
					finish(false);
				}
			}}
			className="w-28 bg-transparent text-foreground text-xs outline-none"
		/>
	);
};

/**
 * A left/right rail runs this same tab on its side. The cell is the tab's box
 * with the axes swapped; the tab is pinned to the cell's centre and rotated
 * about its own, which lands it on the cell exactly.
 *
 * Centring has to be the `top/left-1/2` + `-translate-1/2` kind. The tab is
 * wider than its cell, and every layout-based centring quietly gives up on
 * that: an over-wide grid item grows its track and centres in *that*, and
 * `inset-0 m-auto` hits CSS 2.1 §10.3.7, which zeroes `margin-left` rather
 * than let auto margins go negative. Both leave the tab beside the rail,
 * where the scroller clips it away. Translate percentages resolve against the
 * tab's own box, so they just work.
 */
const RAIL_TAB_CELL = "relative w-7 flex-none";
const RAIL_TAB_TURN =
	"-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-7 w-max max-w-40";

/**
 * One tab, wherever panels are listed: a dock strip, the mobile strip, or a
 * border rail, flat or on its side. Selection, keyboard navigation, inline
 * rename, pin and close affordances, and the context-menu trigger. Dragging
 * is handled by the drag layer through the `data-tab` attribute.
 */
export const WorkbenchTab: FC<WorkbenchTabProps> = memo(
	({ pid, stack, active, location = "tab", compact = false }) => {
		const actions = useWorkbench((s) => s.layout.actions);
		const record = useWorkbench((s) => s.layout.panels[pid]);
		const isEditing = useWorkbench((s) => s.layout.editingPanelId === pid);
		const isDragging = useWorkbench(
			(s) => s.layout.draggingPanelId === pid,
		);
		const readOnly = useWorkbench((s) => s.layout.readOnly);
		const closable = useWorkbench((s) => s.layout.actions.canClose(pid));
		const renamable = useWorkbench((s) => s.layout.actions.canRename(pid));

		const vertical = location === "rail-vertical";
		const lastPress = useRef(0);
		const watcher = useRef<ResizeObserver | null>(null);
		/** the turned tab's own width, which is the cell's height */
		const [runLength, setRunLength] = useState(0);

		// The tab sizes to its label, so the cell has to follow it.
		// `offsetWidth` is the layout width, which a transform does not
		// disturb. A callback ref rather than an effect: it fires exactly when
		// the turned element comes and goes, which is the whole trigger.
		const turnRef = useCallback((el: HTMLDivElement | null) => {
			watcher.current?.disconnect();
			watcher.current = null;
			if (!el) {
				return;
			}
			const measure = () => setRunLength(el.offsetWidth);
			measure();
			watcher.current = new ResizeObserver(measure);
			watcher.current.observe(el);
		}, []);

		if (!record) {
			return null;
		}

		const userCanRename = renamable && !readOnly;
		// on a rail the tab is the open/collapse control, which is what makes
		// clicking the showing panel put it away again
		const select = () =>
			stack.kind === "border"
				? actions.toggleBorderPanel(stack.id as WorkbenchSide, pid)
				: actions.activatePanel(stack, pid);

		const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
			if (isEditing) {
				return;
			}
			const strip = (e.currentTarget as HTMLElement).closest(
				"[data-tabstrip],[role='tablist']",
			);
			const tabs = strip
				? Array.from(strip.querySelectorAll<HTMLElement>("[data-tab]"))
				: [];
			const index = tabs.findIndex(
				(tab) => tab.getAttribute("data-tab") === pid,
			);
			const focusAt = (next: number) => {
				const el = tabs[Math.max(0, Math.min(tabs.length - 1, next))];
				el?.focus();
				const nextPid = el?.getAttribute("data-tab");
				if (nextPid) {
					actions.activatePanel(stack, nextPid);
				}
			};
			if (e.key === "ArrowRight") {
				e.preventDefault();
				focusAt(index + 1);
			} else if (e.key === "ArrowLeft") {
				e.preventDefault();
				focusAt(index - 1);
			} else if (e.key === "Home") {
				e.preventDefault();
				focusAt(0);
			} else if (e.key === "End") {
				e.preventDefault();
				focusAt(tabs.length - 1);
			} else if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				select();
			} else if (e.key === "Delete" || e.key === "Backspace") {
				actions.closePanel(pid);
			} else if (e.key === "F2" && userCanRename) {
				actions.setEditingPanel(pid);
			} else if (e.shiftKey && e.key === "F10") {
				e.preventDefault();
				const rect = (
					e.currentTarget as HTMLElement
				).getBoundingClientRect();
				actions.openMenu(pid, rect.left, rect.bottom);
			}
		};

		const tab = (
			<div
				id={`tab-${pid}`}
				data-tab={pid}
				data-testid={`workbench-tab-${pid}`}
				role="tab"
				aria-selected={active}
				tabIndex={active ? 0 : -1}
				title={record.helpText || record.name}
				onPointerDown={(e) => {
					// primary button only: on a rail `select` toggles the
					// panel, so a right-click would collapse it out from
					// under the context menu it is opening
					if (e.button !== 0 || isEditing) {
						return;
					}
					// the second press of a double-click is the start of a
					// rename and must not select again — on a rail that would
					// toggle the panel straight back. pointerdown carries no
					// click count of its own (`detail` is 0), so time it
					const quick = e.timeStamp - lastPress.current < 500;
					lastPress.current = e.timeStamp;
					if (!quick) {
						select();
					}
				}}
				onContextMenu={(e) => {
					e.preventDefault();
					// no select: the menu is bound to this pid already, and on
					// a rail selecting would toggle the panel shut
					actions.openMenu(pid, e.clientX, e.clientY);
				}}
				onKeyDown={onKeyDown}
				onDoubleClick={() => {
					if (userCanRename && !compact) {
						actions.setEditingPanel(pid);
					}
				}}
				className={cn(
					"group relative flex flex-none touch-none select-none items-center gap-1.5 rounded-md text-xs",
					"max-w-40 px-2.5",
					compact ? "h-10" : "h-7",
					isDragging && "opacity-40",
					active
						? "bg-accent font-medium text-foreground"
						: "cursor-pointer text-muted-foreground hover:bg-accent/50 hover:text-foreground",
				)}
			>
				{isEditing ? (
					<WorkbenchTabRenameInput pid={pid} />
				) : (
					<WorkbenchPanelHeaderContent
						pid={pid}
						location={location}
					/>
				)}
				{/* the controls belong to the selected tab. An unselected one is
				    its icon and its name, and measures to just that — a hidden
				    button still reserves its width, which on a rail is length */}
				{!active ? null : compact ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onPointerDown={(e) => e.stopPropagation()}
								onClick={() => actions.openSheet(pid)}
								className={cn(
									"ml-1 flex items-center justify-center text-muted-foreground",
									CHROME_BUTTON,
								)}
								aria-label={`Options for ${record.name}`}
							>
								<MoreVertical className={CHROME_ICON} />
							</button>
						</TooltipTrigger>
						<TooltipContent>Options</TooltipContent>
					</Tooltip>
				) : record.pinned ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onPointerDown={(e) => e.stopPropagation()}
								onClick={() => {
									if (!readOnly) {
										actions.setPinned(pid, false);
									}
								}}
								data-testid={`workbench-tab-pin-${pid}`}
								className={cn(
									"ml-1 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground",
									CHROME_BUTTON_SM,
								)}
								aria-label={`Unpin ${record.name}`}
							>
								<Pin className={CHROME_ICON_SM} />
							</button>
						</TooltipTrigger>
						<TooltipContent>Unpin</TooltipContent>
					</Tooltip>
				) : !closable ? null : (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onPointerDown={(e) => e.stopPropagation()}
								onClick={() => actions.closePanel(pid)}
								data-testid={`workbench-tab-close-${pid}`}
								className={cn(
									"ml-1 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground",
									compact
										? CHROME_BUTTON
										: cn(
												CHROME_BUTTON_SM,
												"opacity-60 group-hover:opacity-100",
											),
								)}
								aria-label={`Close ${record.name}`}
							>
								<X
									className={
										compact ? CHROME_ICON : CHROME_ICON_SM
									}
								/>
							</button>
						</TooltipTrigger>
						<TooltipContent>Close</TooltipContent>
					</Tooltip>
				)}
			</div>
		);

		if (!vertical) {
			return tab;
		}
		return (
			<div
				className={RAIL_TAB_CELL}
				style={{ height: runLength || undefined }}
			>
				{/* a left rail reads bottom-to-top, a right one top-to-bottom */}
				<div
					ref={turnRef}
					className={cn(
						RAIL_TAB_TURN,
						stack.id === "left" ? "-rotate-90" : "rotate-90",
					)}
				>
					{tab}
				</div>
			</div>
		);
	},
);

WorkbenchTab.displayName = "WorkbenchTab";
