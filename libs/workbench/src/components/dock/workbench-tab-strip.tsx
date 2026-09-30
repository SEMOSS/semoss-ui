import { ChevronDown, X } from "lucide-react";
import { type FC, type ReactNode, useEffect, useState } from "react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	ScrollArea,
	Separator,
} from "@semoss/ui/next";
import { WORKBENCH_STYLES } from "../../constants/workbench.constants";
import type { WorkbenchPanelId } from "../../types";

interface WorkbenchTabStripProps {
	panelIds: WorkbenchPanelId[];
	activeId: WorkbenchPanelId | null;
	nameOf: (pid: WorkbenchPanelId) => string;
	onPick: (pid: WorkbenchPanelId) => void;
	/** Whether a tab may be closed from the list, as its own tab allows. */
	canClose?: (pid: WorkbenchPanelId) => boolean;
	/** Closes a tab from the list. */
	onClose?: (pid: WorkbenchPanelId) => void;
	children: ReactNode;
}

/**
 * The tab strip: a horizontally scrolling row with a themed scrollbar in
 * place of the browser's native one. Once the tabs overflow, a divider and a
 * chevron menu follow the strip, so the tabs read as flowing into the menu
 * rather than just stopping, and a buried tab is reachable without hunting
 * for it by scroll. A tab that can close has a close button in the list, and
 * closes with Delete when its row is focused.
 */
export const WorkbenchTabStrip: FC<WorkbenchTabStripProps> = ({
	panelIds,
	activeId,
	nameOf,
	onPick,
	canClose,
	onClose,
	children,
}) => {
	const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
	const [overflowing, setOverflowing] = useState(false);

	useEffect(() => {
		if (!viewport) {
			return;
		}
		const check = () =>
			setOverflowing(viewport.scrollWidth > viewport.clientWidth + 1);
		check();
		const observer = new ResizeObserver(check);
		observer.observe(viewport);
		return () => observer.disconnect();
	}, [viewport]);

	// keep the active tab in view when it changes from outside the strip
	useEffect(() => {
		if (!activeId || !viewport) {
			return;
		}
		const el = viewport.querySelector<HTMLElement>(
			`[data-tab="${activeId}"]`,
		);
		el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
	}, [activeId, viewport]);

	return (
		<>
			<ScrollArea
				viewportRef={setViewport}
				scrollOrientation="horizontal"
				className="min-w-0 flex-1"
			>
				<div className="flex gap-1">{children}</div>
			</ScrollArea>
			{overflowing && (
				<div className="flex flex-none items-center gap-1">
					<Separator
						orientation="vertical"
						className="mx-0.5 h-5 flex-none"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className={cn(
									"flex-none text-muted-foreground",
									WORKBENCH_STYLES.chromeButton,
								)}
								title={`${panelIds.length} tabs`}
								aria-label="All tabs"
							>
								<ChevronDown
									className={WORKBENCH_STYLES.chromeIcon}
								/>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-52">
							{panelIds.map((pid) => {
								const name = nameOf(pid);
								const closable = !!onClose && !!canClose?.(pid);
								return (
									<DropdownMenuItem
										key={pid}
										onSelect={() => onPick(pid)}
										onKeyDown={(event) => {
											if (
												closable &&
												event.key === "Delete"
											) {
												event.preventDefault();
												onClose?.(pid);
											}
										}}
										className={cn(
											"group/tab-item pe-1",
											pid === activeId &&
												"bg-accent text-foreground",
										)}
									>
										<span className="min-w-0 flex-1 truncate">
											{name}
										</span>
										{closable && (
											// a pointer shortcut; the row closes with Delete
											// from the keyboard, so the button stays out of
											// the menu's focus order
											<button
												type="button"
												tabIndex={-1}
												aria-label={`Close ${name}`}
												title={`Close ${name}`}
												data-testid={`workbench-tab-list-close-${pid}`}
												className={cn(
													"flex flex-none items-center justify-center rounded text-muted-foreground opacity-60 hover:bg-background hover:text-foreground hover:opacity-100 group-focus/tab-item:opacity-100",
													WORKBENCH_STYLES.chromeButtonSm,
												)}
												// the row selects on pointer up and click, so
												// neither may reach it
												onPointerDown={(event) =>
													event.stopPropagation()
												}
												onPointerUp={(event) =>
													event.stopPropagation()
												}
												onClick={(event) => {
													event.preventDefault();
													event.stopPropagation();
													onClose?.(pid);
												}}
											>
												<X
													aria-hidden
													className={
														WORKBENCH_STYLES.chromeIconSm
													}
												/>
											</button>
										)}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</>
	);
};
