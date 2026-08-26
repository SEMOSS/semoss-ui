import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	type FC,
	Fragment,
	type PointerEvent,
	useCallback,
	useRef,
} from "react";
import { Button, cn, Separator } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { WORKBENCH_STYLES } from "./workbench.chrome";
import { WorkbenchTab } from "./workbench-tab";

/**
 * The mobile shell: every stack's tabs in one scrollable strip, a single
 * body slot, swipe navigation, and a pager footer.
 */
export const WorkbenchMobile: FC = () => {
	const actions = useWorkbench((s) => s.layout.actions);
	const stacks = useWorkbench((s) => s.layout.stacks);
	const openPanelIds = useWorkbench((s) => s.layout.openPanelIds);
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

	return (
		<div className="flex h-full min-h-0 flex-col p-2">
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
				<div className="flex flex-none items-stretch gap-1 overflow-x-auto bg-card px-1.5 pt-1.5 pb-1">
					{stacks.map((stack, index) => (
						<Fragment key={stack.key}>
							{index > 0 && (
								<Separator
									orientation="vertical"
									className="my-1.5 h-auto flex-none self-stretch"
								/>
							)}
							{stack.panelIds.map((pid) => (
								<WorkbenchTab
									key={pid}
									pid={pid}
									stack={stack}
									active={mobileActivePanelId === pid}
									compact
								/>
							))}
						</Fragment>
					))}
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
					<ChevronLeft className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
				<span className="text-muted-foreground text-xs">
					{activeIndex + 1} / {openPanelIds.length} · swipe to move
				</span>
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
					<ChevronRight className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
			</div>
		</div>
	);
};
