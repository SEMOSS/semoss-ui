import { ChevronDown } from "lucide-react";
import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import type { WorkbenchPanelId } from "@/stores/workbench";
import { CHROME_BUTTON, CHROME_ICON } from "./workbench.chrome";

export interface WorkbenchTabStripProps {
	panelIds: WorkbenchPanelId[];
	activeId: WorkbenchPanelId | null;
	nameOf: (pid: WorkbenchPanelId) => string;
	onPick: (pid: WorkbenchPanelId) => void;
	children: ReactNode;
}

/**
 * The tab strip measures itself: once the tabs overflow, a chevron appears
 * that lists every tab, so a buried one is still reachable.
 */
export const WorkbenchTabStrip: FC<WorkbenchTabStripProps> = ({
	panelIds,
	activeId,
	nameOf,
	onPick,
	children,
}) => {
	const scroller = useRef<HTMLDivElement | null>(null);
	const [overflowing, setOverflowing] = useState(false);

	useEffect(() => {
		const el = scroller.current;
		if (!el) {
			return;
		}
		const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
		check();
		const observer = new ResizeObserver(check);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// keep the active tab in view when it changes from outside the strip
	useEffect(() => {
		if (!activeId) {
			return;
		}
		const el = scroller.current?.querySelector<HTMLElement>(
			`[data-tab="${activeId}"]`,
		);
		el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
	}, [activeId]);

	return (
		<>
			<div
				ref={scroller}
				className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
			>
				{children}
			</div>
			{overflowing && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className={cn(
								"flex-none text-muted-foreground",
								CHROME_BUTTON,
							)}
							title={`${panelIds.length} tabs`}
							aria-label="All tabs"
						>
							<ChevronDown className={CHROME_ICON} />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-52">
						{panelIds.map((pid) => (
							<DropdownMenuItem
								key={pid}
								onSelect={() => onPick(pid)}
								className={cn(
									pid === activeId &&
										"bg-accent text-foreground",
								)}
							>
								<span className="truncate">{nameOf(pid)}</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</>
	);
};
