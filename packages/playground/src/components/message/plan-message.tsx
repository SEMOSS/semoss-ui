import {
	ChevronDownIcon,
	HammerIcon,
	LinkIcon,
	ListEndIcon,
	ListIndentIncreaseIcon,
	PencilIcon,
	TrashIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Muted,
	Separator,
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
			<div className="w-full overflow-hidden">
				<div className="group flex flex-row items-center gap-2">
					<ListEndIcon className="size-4" />
					<span className="mr-0.5 font-medium text-base">Plan</span>
				</div>
				<p className="mt-2 text-secondary-foreground text-sm">
					Here is the plan that I have created. Feel free to modify it
					as needed.
				</p>

				{message.plan.steps.length > 0 && (
					<div className="mt-4 flex flex-col rounded-lg border border-border p-4">
						{message.plan.steps.map((s) => {
							return (
								<Collapsible
									key={s.step_number}
									className="group"
								>
									<CollapsibleTrigger
										className="flex w-full overflow-hidden [&[data-state=open]>*>svg[data-rotate=true]]:rotate-180"
										asChild
									>
										<div className="flex flex-row items-start gap-1">
											<div className="mt-2 flex flex-1 flex-row items-start gap-4 overflow-hidden">
												<div
													className={`mt-0.5 flex size-4 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-xs`}
												>
													{s.step_number}
												</div>
												<div
													className="flex-1 truncate text-left text-sm"
													title={s.description}
												>
													{s.description}
												</div>
											</div>

											{isLast && (
												<div className="flex flex-row items-center">
													<Button
														variant="ghost"
														size="icon-sm"
														className="invisible group-hover:visible"
														onClick={(e) => {
															e.stopPropagation();

															setEditStep(s);
														}}
													>
														<PencilIcon />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														className="invisible text-destructive group-hover:visible"
														onClick={(e) => {
															e.stopPropagation();

															removeStep(
																s.step_number,
															);
														}}
													>
														<TrashIcon />
													</Button>
												</div>
											)}
											<ChevronDownIcon
												className="mt-2 size-4"
												data-rotate={true}
											/>
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

											{s.details.stepType ===
												"no_tool_available" && (
												<div className="flex flex-row justify-center">
													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															setEditStep(s);
														}}
													>
														<LinkIcon />
														Fix Step
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
					</div>
				)}
				{isLast && (
					<div className="mt-4 flex flex-row gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => setIsAddStepOpen(true)}
						>
							<ListIndentIncreaseIcon />
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
							Confirm Plan
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
