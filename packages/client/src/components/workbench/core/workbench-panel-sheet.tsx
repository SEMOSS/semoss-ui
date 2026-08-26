import { Check, Lock, X } from "lucide-react";
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
import { CHROME_BUTTON, CHROME_ICON } from "./workbench.chrome";

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
							<Check className={CHROME_ICON} />
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

/** Every open panel by stack, plus closed ones that can be reopened. */
const WorkbenchPanelSheetAll: FC = () => {
	const actions = useWorkbench((s) => s.layout.actions);
	const stacks = useWorkbench((s) => s.layout.stacks);
	const closed = useWorkbench((s) => s.layout.closed);
	const panels = useWorkbench((s) => s.layout.panels);

	return (
		<div className="flex flex-col gap-5 p-4">
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
								<span className="flex-1 truncate text-sm">
									{panels[pid]?.name}
								</span>
								<Muted className="text-xs">{stack.label}</Muted>
								{actions.canClose(pid) ? (
									<Button
										variant="ghost"
										size="icon-sm"
										className="text-muted-foreground"
										onClick={() => actions.closePanel(pid)}
										aria-label={`Close ${panels[pid]?.name ?? pid}`}
									>
										<X className={CHROME_ICON} />
									</Button>
								) : (
									<span
										aria-hidden
										className={cn(
											"flex items-center justify-center text-muted-foreground/60",
											CHROME_BUTTON,
										)}
									>
										<Lock className={CHROME_ICON} />
									</span>
								)}
							</li>
						)),
					)}
				</ul>
			</div>

			{closed.length > 0 && (
				<div>
					<Muted className="text-xs uppercase tracking-widest">
						Closed
					</Muted>
					<ul className="mt-2 divide-y divide-border">
						{closed.map((pid) => (
							<li
								key={pid}
								className="flex h-12 items-center gap-2"
							>
								<span className="flex-1 truncate text-muted-foreground text-sm">
									{panels[pid]?.name}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => actions.reopenPanel(pid)}
								>
									Open
								</Button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

/**
 * The panel manager: a right sheet on desktop, a bottom drawer on mobile.
 * Shows either one panel's controls or the full open/closed listing.
 */
export const WorkbenchPanelSheet: FC = () => {
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
		: "Every panel in this workbench.";
	const body: ReactNode = single ? (
		<WorkbenchPanelSheetSingle key={single.id} record={single} />
	) : (
		<WorkbenchPanelSheetAll />
	);

	const onOpenChange = (open: boolean) => {
		if (!open) {
			actions.closeSheet();
		}
	};

	if (isMobileLayout) {
		return (
			<Drawer open onOpenChange={onOpenChange}>
				<DrawerContent data-testid="workbench-panel-sheet">
					<DrawerHeader>
						<DrawerTitle>{title}</DrawerTitle>
						<DrawerDescription>{description}</DrawerDescription>
					</DrawerHeader>
					<ScrollArea className="max-h-[60vh]">{body}</ScrollArea>
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
