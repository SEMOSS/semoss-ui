import { Check, MoreVertical } from "lucide-react";
import { type FC, type ReactNode, useState } from "react";
import {
	Button,
	cn,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	Input,
	Muted,
	ScrollArea,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { WORKBENCH_SIDES, type WorkbenchPanelRecord } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "./workbench.chrome";
import type { WorkbenchBorderSlot } from "./workbench.types";
import { resolveBorderSlot } from "./workbench-border";
import { WorkbenchResetButton } from "./workbench-reset-button";

const sideLabel = (side: string): string =>
	side.length ? side[0].toUpperCase() + side.slice(1) : side;

/** Rename, move, and close controls for one panel. */
const WorkbenchPanelSheetSingle: FC<{ record: WorkbenchPanelRecord }> = ({
	record,
}) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const tabsets = useWorkbench((s) => s.layout.tabsets);
	const readOnly = useWorkbench((s) => s.layout.readOnly);
	const closable = useWorkbench((s) => s.layout.actions.canClose(record.id));
	const draggable = useWorkbench((s) => s.layout.actions.canDrag(record.id));
	const renamable = useWorkbench((s) =>
		s.layout.actions.canRename(record.id),
	);
	const [name, setName] = useState(record.name);

	const saveRename = () => {
		actions.renamePanel(record.id, name);
		actions.closeSheet();
	};

	return (
		<div className="flex flex-col gap-5 p-4">
			{renamable && !readOnly && (
				<div>
					<Muted className="text-xs uppercase tracking-widest">
						Rename panel
					</Muted>
					<div className="mt-2 flex gap-2">
						<Input
							value={name}
							aria-label="Panel name"
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									saveRename();
								}
							}}
						/>
						<Button
							size="icon"
							onClick={saveRename}
							aria-label="Save name"
						>
							<Check className={WORKBENCH_STYLES.chromeIcon} />
						</Button>
					</div>
				</div>
			)}

			{draggable && !readOnly && (
				<>
					<div>
						<Muted className="text-xs uppercase tracking-widest">
							Move to dock
						</Muted>
						<div className="mt-2 flex flex-wrap gap-2">
							{tabsets.map((tabset, index) => (
								<Button
									key={tabset.id}
									variant="outline"
									size="sm"
									onClick={() => {
										actions.movePanel(record.id, {
											kind: "join",
											tabsetId: tabset.id,
										});
										actions.closeSheet();
									}}
								>
									Dock {index + 1}
								</Button>
							))}
						</div>
					</div>
					<div>
						<Muted className="text-xs uppercase tracking-widest">
							Move to border
						</Muted>
						<div className="mt-2 grid grid-cols-2 gap-2">
							{WORKBENCH_SIDES.map((side) => (
								<Button
									key={side}
									variant="outline"
									size="sm"
									onClick={() => {
										actions.movePanel(record.id, {
											kind: "border",
											side,
										});
										actions.closeSheet();
									}}
								>
									{sideLabel(side)}
								</Button>
							))}
						</div>
					</div>
				</>
			)}

			{closable ? (
				<Button
					variant="outline"
					onClick={() => {
						actions.closePanel(record.id);
						actions.closeSheet();
					}}
				>
					Close panel
				</Button>
			) : (
				<Muted className="text-xs">
					This panel can't be closed
					{draggable && !readOnly ? "" : " or moved"}.
				</Muted>
			)}
		</div>
	);
};

/**
 * Every open panel, grouped by stack. On mobile
 * this doubles as the workbench menu: the rail's action buttons lead, and
 * tapping a row shows that panel.
 */
const WorkbenchPanelSheetAll: FC<{ actionsSlot?: WorkbenchBorderSlot }> = ({
	actionsSlot,
}) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const stacks = useWorkbench((s) => s.layout.stacks);
	const panels = useWorkbench((s) => s.layout.panels);
	const readOnly = useWorkbench((s) => s.layout.readOnly);
	const isMobileLayout = useWorkbench((s) => s.layout.isMobileLayout);
	const mobileActivePanelId = useWorkbench(
		(s) => s.layout.mobileActivePanelId,
	);

	// The mobile layout draws no rails, so the left rail's `after` slot and
	// the reset control surface here instead; desktop keeps them on the rail.
	const slotContent = isMobileLayout
		? resolveBorderSlot(actionsSlot, {
				side: "left",
				vertical: false,
				open: false,
				panelIds: [],
			})
		: null;
	const showActions = isMobileLayout && (slotContent || !readOnly);

	return (
		<div className="flex flex-col gap-5 p-4">
			{showActions ? (
				<div>
					<Muted className="text-xs uppercase tracking-widest">
						Actions
					</Muted>
					<div className="mt-2 flex items-center justify-center gap-2 [&_button]:size-10 [&_svg]:size-4">
						{slotContent}
						{readOnly ? null : <WorkbenchResetButton />}
					</div>
				</div>
			) : null}
			<div>
				<Muted className="text-xs uppercase tracking-widest">
					Open
				</Muted>
				<ul className="mt-2 divide-y divide-border">
					{stacks.flatMap((stack) =>
						stack.panelIds.map((pid) => (
							<li
								key={pid}
								className="flex h-12 items-center gap-2"
							>
								<button
									type="button"
									className={cn(
										"flex h-full min-w-0 flex-1 items-center gap-2 text-left text-sm",
										pid === mobileActivePanelId
											? "font-medium text-foreground"
											: "text-foreground/80",
									)}
									onClick={() => {
										actions.activatePanel(
											{ kind: stack.kind, id: stack.id },
											pid,
										);
										actions.closeSheet();
									}}
								>
									<span className="min-w-0 truncate">
										{panels[pid]?.name}
									</span>
								</button>
								<Muted className="text-xs">{stack.label}</Muted>
								<Button
									variant="ghost"
									size="icon-sm"
									className="text-muted-foreground"
									onClick={() => actions.openSheet(pid)}
									aria-label={`Options for ${panels[pid]?.name ?? pid}`}
								>
									<MoreVertical
										className={WORKBENCH_STYLES.chromeIcon}
									/>
								</Button>
							</li>
						)),
					)}
				</ul>
			</div>
		</div>
	);
};

export interface WorkbenchPanelSheetProps {
	/**
	 * The left rail's `after` slot. The mobile drawer's "all" view surfaces it
	 * as an actions row, since the mobile layout draws no rails.
	 */
	actionsSlot?: WorkbenchBorderSlot;
}

/**
 * The panel manager: a right sheet on desktop, a bottom drawer on mobile.
 * Shows either one panel's controls or the full listing of open panels — on
 * mobile the latter leads with the workbench actions.
 */
export const WorkbenchPanelSheet: FC<WorkbenchPanelSheetProps> = ({
	actionsSlot,
}) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const sheet = useWorkbench((s) => s.layout.sheet);
	const isMobileLayout = useWorkbench((s) => s.layout.isMobileLayout);
	const record = useWorkbench((s) =>
		s.layout.sheet && s.layout.sheet !== "all"
			? s.layout.panels[s.layout.sheet]
			: undefined,
	);

	if (!sheet) {
		return null;
	}

	const single = sheet !== "all" ? record : undefined;
	const title = single ? single.name : "Panels";
	const description = single
		? "Rename, move, or close this panel."
		: isMobileLayout
			? "Actions and every panel in this workbench."
			: "Every panel in this workbench.";
	const body: ReactNode = single ? (
		<WorkbenchPanelSheetSingle key={single.id} record={single} />
	) : (
		<WorkbenchPanelSheetAll actionsSlot={actionsSlot} />
	);

	const onOpenChange = (open: boolean) => {
		if (!open) {
			actions.closeSheet();
		}
	};

	if (isMobileLayout) {
		return (
			<Drawer open onOpenChange={onOpenChange}>
				<DrawerContent
					data-testid="workbench-panel-sheet"
					className="pb-[env(safe-area-inset-bottom)]"
				>
					<DrawerHeader>
						<DrawerTitle>{title}</DrawerTitle>
						<DrawerDescription>{description}</DrawerDescription>
					</DrawerHeader>
					<ScrollArea className="max-h-[60vh] min-h-0">
						{body}
					</ScrollArea>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Sheet open onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-80"
				data-testid="workbench-panel-sheet"
			>
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
					<SheetDescription>{description}</SheetDescription>
				</SheetHeader>
				<ScrollArea className="min-h-0 flex-1">{body}</ScrollArea>
			</SheetContent>
		</Sheet>
	);
};
