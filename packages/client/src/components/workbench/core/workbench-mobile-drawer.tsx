import type { FC } from "react";
import {
	Badge,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	Item,
	ItemActions,
	ItemContent,
	ItemTitle,
	Muted,
	ScrollArea,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type { WorkbenchBorderSlot } from "./workbench.types";
import { resolveBorderSlot } from "./workbench-border";
import { WorkbenchResetButton } from "./workbench-reset-button";

export interface WorkbenchMobileDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/**
	 * The left rail's `after` slot. The mobile shell draws no rails, so the
	 * workbench's own toolbar actions surface here instead.
	 */
	actionsSlot?: WorkbenchBorderSlot;
}

/**
 * The mobile shell's bottom drawer: the workbench's toolbar actions, then every
 * open panel as a row that switches to it.
 *
 * Mobile-only by construction — `WorkbenchMobile` renders it, not the shell, so
 * it does not exist on desktop, where the rails and tab strips already cover
 * picking a panel. Its open state is that view's `useState`, deliberately not
 * layout-store state: nothing else can open it.
 */
export const WorkbenchMobileDrawer: FC<WorkbenchMobileDrawerProps> = ({
	open,
	onOpenChange,
	actionsSlot,
}) => {
	const actions = useWorkbench((s) => s.layout.actions);
	const stacks = useWorkbench((s) => s.layout.stacks);
	const panels = useWorkbench((s) => s.layout.panels);
	const readOnly = useWorkbench((s) => s.layout.readOnly);
	const mobileActivePanelId = useWorkbench(
		(s) => s.layout.mobileActivePanelId,
	);

	const slotContent = resolveBorderSlot(actionsSlot, {
		side: "left",
		vertical: false,
		open: false,
		panelIds: [],
	});
	const showActions = Boolean(slotContent) || !readOnly;

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent
				data-testid="workbench-mobile-drawer"
				className="pb-[env(safe-area-inset-bottom)]"
			>
				<DrawerHeader>
					<DrawerTitle>Panels</DrawerTitle>
					<DrawerDescription>
						Actions and every panel in this workbench.
					</DrawerDescription>
				</DrawerHeader>
				<ScrollArea className="max-h-[60vh] min-h-0">
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
							<ul className="mt-2 flex flex-col gap-1">
								{stacks.flatMap((stack) =>
									stack.panelIds.map((pid) => {
										const isActive =
											pid === mobileActivePanelId;

										return (
											<li key={pid}>
												{/* the whole row is the tap
												    target — a phone has no
												    room for a second control
												    per panel */}
												<Item
													asChild
													size="sm"
													variant={
														isActive
															? "muted"
															: "default"
													}
												>
													<button
														type="button"
														data-testid={`workbench-mobile-drawer-panel-${pid}`}
														aria-current={
															isActive
																? "true"
																: undefined
														}
														className="w-full cursor-pointer text-left hover:bg-accent/50"
														onClick={() => {
															actions.activatePanel(
																{
																	kind: stack.kind,
																	id: stack.id,
																},
																pid,
															);
															onOpenChange(false);
														}}
													>
														<ItemContent className="min-w-0">
															<ItemTitle className="w-full truncate">
																{
																	panels[pid]
																		?.name
																}
															</ItemTitle>
														</ItemContent>
														<ItemActions>
															<Badge variant="secondary">
																{stack.label}
															</Badge>
														</ItemActions>
													</button>
												</Item>
											</li>
										);
									}),
								)}
							</ul>
						</div>
					</div>
				</ScrollArea>
			</DrawerContent>
		</Drawer>
	);
};
