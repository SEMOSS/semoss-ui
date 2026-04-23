import { CheckCircle, Clock } from "lucide-react";
import { cn } from "@semoss/ui/next";
import {
	PROMPT_BUILDER_INPUT_TYPES_STEP,
	PROMPT_BUILDER_PREVIEW_STEP,
	SUMMARY_STEPS,
	TOKEN_TYPE_INPUT,
} from "../../prompt.constants";
import type { Builder, BuilderStepItem, Token } from "../../prompt.types";
import { PromptBuilderSummaryProgress } from "./prompt-builder-summary-progress";

export const PromptBuilderSummary = (props: {
	builder: Builder;
	currentBuilderStep: number;
	isBuilderStepComplete: (step: number) => boolean;
	isBuildStepsComplete: () => boolean;
	changeBuilderStep: (step: number) => void;
}) => {
	const builderProgress = () => {
		const builderArray = Object.values(props.builder);
		const completedStepsToCount = builderArray.filter(
			(builderStepItem: BuilderStepItem) => {
				return (
					builderStepItem.step < props.currentBuilderStep ||
					(builderStepItem.step === props.currentBuilderStep &&
						(!builderStepItem.required ||
							(builderStepItem.required &&
								(builderStepItem.step ===
								PROMPT_BUILDER_INPUT_TYPES_STEP
									? props.isBuilderStepComplete(
											PROMPT_BUILDER_INPUT_TYPES_STEP,
										)
									: !!builderStepItem.value))))
				);
			},
		);
		return builderArray.length === completedStepsToCount.length
			? 100
			: Math.round(100 / builderArray.length) *
					completedStepsToCount.length;
	};

	return (
		<nav className="flex flex-col gap-1">
			<div className="mb-2 rounded-md px-3 py-2">
				<p className="mb-1 font-bold text-primary text-xs">
					Overall Completion
				</p>
				<PromptBuilderSummaryProgress progress={builderProgress()} />
			</div>

			{Array.from(
				SUMMARY_STEPS,
				(step: { title: string; icon: React.ElementType }, i) => {
					let isStepComplete = props.isBuilderStepComplete(i + 1);
					let disabled =
						i + 1 > props.currentBuilderStep && !isStepComplete;
					const isActive = props.currentBuilderStep === i + 1;

					if (i === PROMPT_BUILDER_PREVIEW_STEP - 1) {
						const completedSteps = props.isBuildStepsComplete();
						disabled = !completedSteps;
						isStepComplete = false;
					}

					if (i + 1 === PROMPT_BUILDER_INPUT_TYPES_STEP) {
						const hasInputs = (
							props.builder.inputs.value as Token[]
						)?.some(
							(token: Token) => token.type === TOKEN_TYPE_INPUT,
						);
						disabled = !hasInputs;
					}

					return (
						<button
							type="button"
							key={step.title}
							disabled={disabled}
							onClick={() =>
								!disabled && props.changeBuilderStep(i + 1)
							}
							className={cn(
								"flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
								disabled
									? "cursor-default text-muted-foreground opacity-50"
									: isStepComplete
										? "text-primary"
										: "text-foreground",
								isActive && !disabled && "bg-primary/10",
								!isActive && !disabled && "hover:bg-muted",
							)}
						>
							<div
								className={cn(
									"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
									disabled
										? "bg-muted text-muted-foreground"
										: isStepComplete
											? "bg-primary/15 text-primary"
											: isActive
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground",
								)}
							>
								<step.icon className="h-4 w-4" />
							</div>
							<span className="flex-1 font-medium">
								{step.title}
							</span>
							{isStepComplete ? (
								<CheckCircle
									className={cn(
										"h-4 w-4 shrink-0",
										isActive
											? "text-foreground"
											: "text-primary",
									)}
								/>
							) : (
								<Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
							)}
						</button>
					);
				},
			)}
		</nav>
	);
};
