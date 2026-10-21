import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import {
	type FC,
	type PointerEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Button, cn, Small } from "@semoss/ui/next";
import { WORKBENCH_STYLES } from "../../constants/workbench.constants";
import { useWorkbench } from "../../hooks/use-workbench";
import type { WorkbenchBorderSlot, WorkbenchBorderSlotCtx } from "../../types";
import { resolveBorderSlot } from "../../utility/workbench-border-slot";
import { WorkbenchTab } from "../dock/workbench-tab";
import { WorkbenchMobileDrawer } from "./workbench-mobile-drawer";

interface WorkbenchMobileProps {
	/**
	 * The left rail's `after` slot. The mobile shell draws no rails, so it
	 * hands this to the drawer, which is the only place it can surface.
	 */
	actionsSlot?: WorkbenchBorderSlot;
	/** Optional persistent host controls; panel tabs remain in the mobile strip. */
	topSlots?: { before?: WorkbenchBorderSlot; after?: WorkbenchBorderSlot };
}

/**
 * The mobile shell: every stack's tabs in one scrollable strip, a single
 * body slot, swipe navigation, and a pager footer whose menu button opens the
 * drawer.
 *
 * The drawer's open state is local — nothing outside this view can open it, so
 * it has no business in the layout store.
 */
export const WorkbenchMobile: FC<WorkbenchMobileProps> = ({
	actionsSlot,
	topSlots,
}) => {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const actions = useWorkbench((s) => s.layout.actions);
	const stacks = useWorkbench((s) => s.layout.stacks);
	const openPanelIds = useWorkbench((s) => s.layout.openPanelIds);
	const topPanelIds = useWorkbench((s) => s.layout.borders.top.panelIds);
	const mobileActivePanelId = useWorkbench(
		(s) => s.layout.mobileActivePanelId,
	);

	// stable: an inline arrow would re-register the slot on every render
	const bodyRef = useCallback(
		(el: HTMLDivElement | null) => {
			actions.registerSlotElement("mobile", el);
		},
		[actions],
	);

	const swipe = useRef<{ x: number; y: number } | null>(null);
	const activeIndex = mobileActivePanelId
		? openPanelIds.indexOf(mobileActivePanelId)
		: -1;

	// keep the active tab in view when swipe or the pager changes it
	const stripRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!mobileActivePanelId) {
			return;
		}
		stripRef.current
			?.querySelector<HTMLElement>(`[data-tab="${mobileActivePanelId}"]`)
			?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
	}, [mobileActivePanelId]);

	const onSwipeEnd = (e: PointerEvent<HTMLDivElement>) => {
		const start = swipe.current;
		swipe.current = null;
		if (!start) {
			return;
		}
		const dx = e.clientX - start.x;
		if (Math.abs(dx) < 60 || Math.abs(e.clientY - start.y) > 45) {
			return;
		}
		const next = openPanelIds[activeIndex + (dx < 0 ? 1 : -1)];
		if (next) {
			actions.setMobileActivePanel(next);
		}
	};
	const topContext: WorkbenchBorderSlotCtx = {
		side: "top",
		vertical: false,
		open: false,
		panelIds: topPanelIds,
	};
	const before = resolveBorderSlot(topSlots?.before, topContext);
	const after = resolveBorderSlot(topSlots?.after, topContext);

	return (
		<div className="flex h-full min-h-0 flex-col p-2">
			{before || after ? (
				<div
					data-testid="workbench-mobile-toolbar"
					data-slot="workbench-mobile-toolbar"
					className="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card p-1"
				>
					<div className="flex min-w-0 flex-1 items-center gap-1">
						{before}
					</div>
					<div className="flex shrink-0 items-center gap-1">
						{after}
					</div>
				</div>
			) : null}
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
				<div
					ref={stripRef}
					role="tablist"
					data-tabstrip
					className="flex flex-none items-center gap-1 overflow-x-auto border-border border-b bg-card px-1.5 py-1.5"
				>
					{stacks.flatMap((stack) =>
						stack.panelIds.map((pid) => (
							<WorkbenchTab
								key={pid}
								pid={pid}
								stack={stack}
								active={mobileActivePanelId === pid}
								compact
							/>
						)),
					)}
				</div>
				<div
					ref={bodyRef}
					data-radius={WORKBENCH_STYLES.slotRadius({
						br: true,
						bl: true,
					})}
					onPointerDown={(e) => {
						swipe.current = { x: e.clientX, y: e.clientY };
					}}
					onPointerUp={onSwipeEnd}
					className="relative min-h-0 flex-1 touch-pan-y bg-card"
				/>
			</div>
			<div
				className={cn(
					"flex flex-none items-center justify-between px-2",
					WORKBENCH_STYLES.railThickness.horizontal,
				)}
			>
				<Button
					variant="ghost"
					size="icon"
					className="text-muted-foreground"
					onClick={() => {
						const prev = openPanelIds[Math.max(0, activeIndex - 1)];
						if (prev) {
							actions.setMobileActivePanel(prev);
						}
					}}
					disabled={activeIndex <= 0}
					data-testid="workbench-mobile-prev"
					aria-label="Previous panel"
				>
					<ChevronLeft
						aria-hidden="true"
						className={WORKBENCH_STYLES.mobileIcon}
					/>
				</Button>
				<div className="flex items-center gap-1">
					<Small className="text-muted-foreground text-xs">
						{activeIndex + 1} / {openPanelIds.length}
					</Small>
					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground"
						onClick={() => setIsDrawerOpen(true)}
						data-testid="workbench-mobile-menu"
						aria-label="Panels and actions"
					>
						<Menu
							aria-hidden="true"
							className={WORKBENCH_STYLES.mobileIcon}
						/>
					</Button>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="text-muted-foreground"
					onClick={() => {
						const next =
							openPanelIds[
								Math.min(
									openPanelIds.length - 1,
									activeIndex + 1,
								)
							];
						if (next) {
							actions.setMobileActivePanel(next);
						}
					}}
					disabled={activeIndex >= openPanelIds.length - 1}
					data-testid="workbench-mobile-next"
					aria-label="Next panel"
				>
					<ChevronRight
						aria-hidden="true"
						className={WORKBENCH_STYLES.mobileIcon}
					/>
				</Button>
			</div>

			<WorkbenchMobileDrawer
				open={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
				actionsSlot={actionsSlot}
			/>
		</div>
	);
};
