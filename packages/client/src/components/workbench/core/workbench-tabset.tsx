import { Maximize2, Minimize2 } from "lucide-react";
import {
	type CSSProperties,
	type FC,
	Fragment,
	useCallback,
	useMemo,
} from "react";
import { useShallow } from "zustand/react/shallow";
import {
	Button,
	cn,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import {
	measure,
	type WorkbenchPanelId,
	type WorkbenchPanelRecord,
	type WorkbenchTabset as WorkbenchTabsetNode,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "./workbench.chrome";
import { WorkbenchPanelControls } from "./workbench-panel-header";
import { WorkbenchResizer } from "./workbench-resizer";
import { WorkbenchTab } from "./workbench-tab";
import { WorkbenchTabStrip } from "./workbench-tab-strip";

export interface WorkbenchTabsetProps {
	node: WorkbenchTabsetNode;
}

/** One dock: its tab strip, controls, and the slot its bodies draw over. */
export const WorkbenchTabset: FC<WorkbenchTabsetProps> = ({ node }) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const maximized = useWorkbench(
		(s) => s.layout.maximizedTabsetId === node.id,
	);
	const activeCanMaximize = useWorkbench((s) =>
		s.layout.actions.canMaximize(node.activeId),
	);
	// member records, shallow-compared so only member changes re-render this dock
	const memberRecords = useWorkbench(
		useShallow((s) => node.panelIds.map((pid) => s.layout.panels[pid])),
	);

	/** css constraints for this dock, from the strictest of its panels */
	const limits = useMemo((): CSSProperties => {
		const panels: Record<WorkbenchPanelId, WorkbenchPanelRecord> = {};
		for (const record of memberRecords) {
			if (record) {
				panels[record.id] = record;
			}
		}
		const x = measure(node, "x", panels);
		const y = measure(node, "y", panels);
		return {
			minWidth: x.min || undefined,
			maxWidth: Number.isFinite(x.max) ? x.max : undefined,
			minHeight: y.min || undefined,
			maxHeight: Number.isFinite(y.max) ? y.max : undefined,
		};
	}, [node, memberRecords]);

	// stable ref callbacks: an inline arrow re-registers (and re-observes) the
	// slot on every render of this dock
	const bodyRef = useCallback(
		(el: HTMLDivElement | null) => {
			actions.registerSlotElement(node.id, el);
		},
		[actions, node.id],
	);
	const splitBodyRef = useCallback(
		(el: HTMLDivElement | null) => {
			actions.registerSlotElement(`${node.id}::b`, el);
		},
		[actions, node.id],
	);

	const stack = { kind: "tabset" as const, id: node.id };
	const showMaximize = node.enableMaximize !== false && activeCanMaximize;
	// with no strip the slot reaches the card's top edge too
	const capped = node.enableTabStrip === false;
	const maximizeLabel = maximized ? "Minimize" : "Maximize";
	const row = node.split?.dir === "row";

	return (
		<>
			{/* a maximized dock leaves the flow, so a placeholder holds its
			    share of the tree and every other dock stays where it was */}
			{maximized && (
				<div
					aria-hidden
					style={{ flexGrow: node.size, flexBasis: 0 }}
					className="min-h-0 min-w-0"
				/>
			)}
			<div
				data-tabset={node.id}
				data-testid={`workbench-tabset-${node.id}`}
				style={
					maximized
						? undefined
						: { flexGrow: node.size, flexBasis: 0, ...limits }
				}
				className={cn(
					"flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card",
					maximized && "fixed inset-4 z-50 shadow-lg",
				)}
			>
				{node.enableTabStrip === false ? null : (
					<div
						data-tabstrip={node.id}
						role="tablist"
						aria-label="Panels"
						className="flex min-w-0 flex-none items-stretch gap-1 border-border border-b bg-card px-1.5 pt-1.5 pb-1"
					>
						<WorkbenchTabStrip
							panelIds={node.panelIds}
							activeId={node.activeId}
							nameOf={(pid) =>
								memberRecords.find((r) => r?.id === pid)
									?.name ?? pid
							}
							onPick={(pid) => actions.activatePanel(stack, pid)}
						>
							{node.panelIds.map((pid, index) => {
								// a rule marks where the pinned block ends, so the
								// two drop regions are visible rather than implied
								const prev =
									index > 0
										? memberRecords[index - 1]
										: undefined;
								const boundary =
									index > 0 &&
									Boolean(prev?.pinned) &&
									!memberRecords[index]?.pinned;
								const tab = (
									<WorkbenchTab
										key={pid}
										pid={pid}
										stack={stack}
										active={node.activeId === pid}
									/>
								);
								return boundary ? (
									<Fragment key={`${pid}:boundary`}>
										<Separator
											orientation="vertical"
											className="my-1 h-auto flex-none self-stretch"
										/>
										{tab}
									</Fragment>
								) : (
									tab
								);
							})}
						</WorkbenchTabStrip>
						<div className="flex flex-none items-center gap-1">
							<WorkbenchPanelControls
								pid={node.activeId}
								location="tab"
							/>
							{showMaximize && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											className={cn(
												"flex-none text-muted-foreground",
												WORKBENCH_STYLES.chromeButton,
											)}
											onClick={() =>
												actions.toggleMaximize(node.id)
											}
											aria-label={maximizeLabel}
											aria-pressed={maximized}
										>
											{maximized ? (
												<Minimize2
													className={
														WORKBENCH_STYLES.chromeIcon
													}
												/>
											) : (
												<Maximize2
													className={
														WORKBENCH_STYLES.chromeIcon
													}
												/>
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{maximizeLabel}
									</TooltipContent>
								</Tooltip>
							)}
						</div>
					</div>
				)}
				{node.split ? (
					<div
						className={cn(
							"flex min-h-0 flex-1",
							node.split.dir === "row" ? "flex-row" : "flex-col",
						)}
					>
						<div
							ref={bodyRef}
							data-body={node.id}
							data-radius={WORKBENCH_STYLES.slotRadius({
								tl: capped,
								tr: capped && !row,
								bl: row,
							})}
							style={{
								flexGrow: node.split.ratio ?? 0.5,
								flexBasis: 0,
							}}
							className="relative min-h-0 min-w-0"
						/>
						<WorkbenchResizer kind="tab-split" tabset={node} />
						<div
							ref={splitBodyRef}
							data-radius={WORKBENCH_STYLES.slotRadius({
								tr: capped && row,
								br: true,
								bl: !row,
							})}
							style={{
								flexGrow: 1 - (node.split.ratio ?? 0.5),
								flexBasis: 0,
							}}
							className="relative min-h-0 min-w-0"
						/>
					</div>
				) : (
					<div
						ref={bodyRef}
						data-body={node.id}
						data-radius={WORKBENCH_STYLES.slotRadius({
							tl: capped,
							tr: capped,
							br: true,
							bl: true,
						})}
						className="relative min-h-0 flex-1"
					>
						{!node.activeId && (
							<div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground text-sm">
								No panel here.
							</div>
						)}
					</div>
				)}
			</div>
		</>
	);
};
