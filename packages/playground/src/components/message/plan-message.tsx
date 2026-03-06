import {
	ChevronRightIcon,
	Ellipsis,
	HammerIcon,
	ListEndIcon,
	PlusIcon,
	ShieldXIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	ButtonGroup,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Muted,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { EditStepOverlay } from "@/components";
import type { PlanMessageStore } from "@/stores";
import type { PlanStep } from "@/types";

// Styled components replaced with Tailwind classes inline

interface PlanMessageProps {
	/** Message to render */
	message: PlanMessageStore;

	/** Track if it is the last message */
	isLast: boolean;
}

export const PlanMessage: React.FC<PlanMessageProps> = observer(
	({ message, isLast }) => {
		const { t } = useTranslation("chat");
		const [editStep, setEditStep] = useState<PlanStep | null>(null);
		const [isAddStepOpen, setIsAddStepOpen] = useState(false);

		/**
		 * Accept the plan
		 */
		const acceptPlan = () => {
			try {
				message.confirmPlan();
			} catch (e) {
				toast.error(e.message);
			}
		};

		/**
		 * Remove a step from the plan
		 * @param step_number Step number to remove
		 */
		const removeStep = (step_number: number) => {
			try {
				message.removeStep(step_number);

				toast.success(
					t("notifications.planStepRemoved", {
						stepNumber: step_number,
					}),
				);
			} catch (e) {
				toast.error(e.message);
			}
		};

		// only accept if all tools are there
		let canAccept = true;
		for (const step of message.plan.steps) {
			if (
				step.details.stepType === "no_tool_available" ||
				step.details.stepType === "human_intervention"
			) {
				canAccept = false;
				break;
			}
		}

		return (
			<div className="w-full overflow-hidden">
				<div className="group flex flex-row items-center gap-2">
					<ListEndIcon className="size-4" />
					<span className="mr-0.5 font-medium text-base">
						{message.model.name}
					</span>
				</div>
				<p className="normal mt-2 mb-3 text-base text-foreground leading-normal">
					{t("plan.heading")}
				</p>
				{message.plan.steps.length > 0 && (
					<div className="flex flex-col">
						<div className="rounded-t-md border-input border-t border-r border-l bg-primary-foreground px-3 py-4">
							Plan
						</div>
						{message.plan.steps.map((s) => {
							const needsResolution =
								s.details.stepType === "no_tool_available" ||
								s.details.stepType === "human_intervention";

							return (
								<Collapsible
									key={s.step_number}
									className="border-input border-t border-r border-l px-3 py-4 last:rounded-b-md last:border-b"
								>
									<CollapsibleTrigger
										className="flex w-full overflow-hidden [&[data-state=open]>svg[data-rotate=true]]:rotate-90"
										asChild
									>
										<div className="flex flex-row items-center gap-2">
											<ChevronRightIcon
												className="size-4"
												data-rotate={true}
											/>
											<div
												className="flex-1 truncate text-left text-sm"
												title={s.step_name}
											>
												{s.step_name}
											</div>

											{isLast && (
												<ButtonGroup>
													{needsResolution && (
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	size="icon-sm"
																	variant="ghost"
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();

																		setEditStep(
																			s,
																		);
																	}}
																>
																	<ShieldXIcon className="text-destructive" />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																{t(
																	"plan.fixStep",
																)}
															</TooltipContent>
														</Tooltip>
													)}
													<DropdownMenu>
														<DropdownMenuTrigger
															asChild
														>
															<Button
																className=""
																size="icon-sm"
																variant="ghost"
																onClick={(e) =>
																	e.stopPropagation()
																}
															>
																<Ellipsis />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuGroup>
																<DropdownMenuItem
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();
																		setEditStep(
																			s,
																		);
																	}}
																>
																	{t(
																		"plan.edit",
																	)}
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();
																		removeStep(
																			s.step_number,
																		);
																	}}
																>
																	{t(
																		"plan.delete",
																	)}
																</DropdownMenuItem>
															</DropdownMenuGroup>
														</DropdownMenuContent>
													</DropdownMenu>
												</ButtonGroup>
											)}
										</div>
									</CollapsibleTrigger>
									<CollapsibleContent className="group flex flex-row py-2">
										<Separator
											orientation="vertical"
											className="mr-6 ml-2 h-auto!"
										/>

										<div className="flex flex-1 flex-col gap-2.5 overflow-hidden">
											<Muted className="block">
												{s.details.rationaleForStep}
											</Muted>

											{needsResolution && (
												<div className="flex flex-row justify-center">
													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															setEditStep(s);
														}}
													>
														<ShieldXIcon />
														{t("plan.fixStep")}
													</Button>
												</div>
											)}

											{s.details.stepType ===
												"tool_call" && (
												<div className="flex flex-row justify-between">
													<div className="flex max-w-1/2 flex-row items-center gap-1 rounded-4xl border border-border bg-sidebar-accent px-4 py-1.5">
														<div className="rounded-sm border border-border bg-background p-1">
															<HammerIcon className="size-4 text-muted-foreground" />
														</div>
														<div className="truncate text-sidebar-accent-foreground text-sm">
															{s.details.title}
														</div>
													</div>
												</div>
											)}
										</div>
									</CollapsibleContent>
								</Collapsible>
							);
						})}

						{isLast && (
							<button
								type="button"
								className="flex w-full flex-row items-center gap-2 border-input border-t border-r border-l px-3 py-4 last:rounded-b-md last:border-b hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
								onClick={() => setIsAddStepOpen(true)}
							>
								<PlusIcon className="size-4" />
								<div
									className="flex-1 truncate text-left font-medium text-muted-foreground text-sm leading-normal"
									title={"Add a new step to the plan"}
								>
									{t("plan.addTask")}
								</div>
							</button>
						)}
					</div>
				)}
				{isLast && (
					<div className="mt-2 flex flex-row justify-end gap-2">
						<Button
							size="sm"
							variant="default"
							disabled={!canAccept}
							onClick={() => {
								acceptPlan();
							}}
						>
							{t("plan.confirmPlan")}
						</Button>
					</div>
				)}

				{isAddStepOpen && (
					<EditStepOverlay
						mode="New"
						open={true}
						onOpenChange={(isOpen) => {
							if (!isOpen) {
								setIsAddStepOpen(false);
							}
						}}
						onSubmit={async (step) => {
							// update the plan if successful
							if (step) {
								message.addStep(step);
							}
						}}
					/>
				)}

				{editStep && (
					<EditStepOverlay
						mode="Edit"
						current={editStep}
						open={true}
						onOpenChange={(isOpen) => {
							if (!isOpen) {
								setEditStep(null);
							}
						}}
						onSubmit={async (step) => {
							// update the plan if successful
							if (step) {
								message.updateStep(step.step_number, step);
							}

							// close it
							setEditStep(null);
						}}
					/>
				)}
			</div>
		);
	},
);
