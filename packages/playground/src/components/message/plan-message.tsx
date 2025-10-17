import {
	ArrowDownRightIcon,
	BrainIcon,
	CheckIcon,
	ChevronDownIcon,
	CircleDashedIcon,
	CircleQuestionMarkIcon,
	HammerIcon,
	LinkIcon,
	PersonStandingIcon,
	PlusIcon,
	TrashIcon,
	TriangleAlert,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	Card,
	CardContent,
	CardFooter,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Muted,
	Spinner,
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
					`Successfully removed step ${step_number} from plan`,
				);
			} catch (e) {
				toast.error(e.message);
			}
		};

		// only accept if all tools are there
		let canAccept = true;
		for (const step of message.plan.steps) {
			if (step.details.stepType === "no_tool_available") {
				canAccept = false;
				break;
			}
		}

		return (
			<div className="w-full overflow-hidden rounded-md bg-card px-4 py-3 shadow-sm">
				<div className="group mb-2 flex flex-row items-center">
					<span className="mr-0.5 text-muted-foreground text-xs">
						Plan
					</span>
					<ArrowDownRightIcon className="mr-3 size-4" />
				</div>
				<p className="text-base">
					Here is the plan that I have created. Feel free to modify it
					as needed.
				</p>

				<Card className="mx-auto mt-6 w-full max-w-4xl">
					{message.plan.steps.length > 0 && (
						<CardContent>
							{message.plan.steps.map((s) => {
								let color = "";
								if (s.status === "failed") {
									color = "bg-error";
								} else if (s.status === "completed") {
									color = "bg-primary";
								} else {
									color = "bg-secondary";
								}

								let icon = null;
								if (s.status === "failed") {
									icon = <XIcon />;
								} else if (s.status === "completed") {
									icon = <CheckIcon />;
								} else if (s.status === "in_progress") {
									icon = <Spinner />;
								} else if (s.status === "pending") {
									icon = <CircleDashedIcon />;
								}

								if (s.details.stepType === "tool_call") {
									icon = <HammerIcon />;
								} else if (
									s.details.stepType === "llm_reasoning"
								) {
									icon = <BrainIcon />;
								} else if (
									s.details.stepType === "human_intervention"
								) {
									icon = <PersonStandingIcon />;
								} else if (
									s.details.stepType === "no_tool_available"
								) {
									color = "bg-warning";
									icon = <TriangleAlert />;
								}

								return (
									<Collapsible
										key={s.step_number}
										// className="pb-4"
									>
										<CollapsibleTrigger
											className="group flex w-full flex-row items-start gap-2 [&[data-state=open]>*>svg[data-rotate=true]]:rotate-180"
											asChild
										>
											<span>
												<div
													className={`${color} mr-1 flex size-8 flex-col items-center justify-center overflow-hidden rounded-full p-2`}
												>
													{icon}
												</div>
												<span className="wrap-break-word mt-1 text-left text-base">
													{s.step_name}
												</span>
												<Tooltip>
													<TooltipTrigger asChild>
														<span>
															<Button
																variant="ghost"
																size="icon"
																className="invisible group-hover:visible"
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																}}
															>
																<CircleQuestionMarkIcon />
															</Button>
														</span>
													</TooltipTrigger>
													<TooltipContent>
														{
															s.details
																.rationaleForStep
														}
													</TooltipContent>
												</Tooltip>

												<div className="flex-1">
													{" "}
													&nbsp;
												</div>

												{isLast && (
													<Button
														variant="ghost"
														size="icon"
														className="invisible group-hover:visible"
														onClick={(e) => {
															e.stopPropagation();

															removeStep(
																s.step_number,
															);
														}}
													>
														<TrashIcon className="text-destructive" />
													</Button>
												)}
												<Button
													variant="ghost"
													size="icon"
												>
													<ChevronDownIcon
														data-rotate={true}
													/>
												</Button>
											</span>
										</CollapsibleTrigger>
										<CollapsibleContent className="mt-2 mb-2 rounded-lg bg-sidebar-accent p-4">
											<div>
												<Muted className="block">
													{s.description}
												</Muted>

												{s.details.stepType ===
													"no_tool_available" && (
													<div className="flex flex-row justify-center">
														<Button
															size="sm"
															className="bg-warning"
															onClick={() => {
																setEditStep(s);
															}}
														>
															<LinkIcon />
															Fix Step
														</Button>
													</div>
												)}
											</div>
										</CollapsibleContent>
									</Collapsible>
								);
							})}
						</CardContent>
					)}
					{isLast && (
						<CardFooter className="justify-between">
							<Button
								size="sm"
								variant="outline"
								onClick={() => setIsAddStepOpen(true)}
							>
								<PlusIcon />
								Add
							</Button>
							<Button
								size="sm"
								variant="default"
								disabled={!canAccept}
								onClick={() => {
									acceptPlan();
								}}
							>
								<CheckIcon />
								Accept
							</Button>
						</CardFooter>
					)}

					{isAddStepOpen && (
						<EditStepOverlay
							mode="Add"
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
							mode="Update"
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
				</Card>
			</div>
		);
	},
);
