import { CheckCircle, Clock } from "lucide-react";
import {
	PROMPT_BUILDER_INPUT_TYPES_STEP,
	PROMPT_BUILDER_PREVIEW_STEP,
	SUMMARY_STEPS,
	TOKEN_TYPE_INPUT,
} from "../../prompt.constants";
import type { Builder, BuilderStepItem, Token } from "../../prompt.types";
import { PromptBuilderSummaryProgress } from "./PromptBuilderSummaryProgress";

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
			<div className="mb-2 rounded-md p-2">
				<p className="text-sm font-bold text-green-600">
					Overall Completion
				</p>
				<PromptBuilderSummaryProgress
					progress={builderProgress()}
				/>
			</div>

			{Array.from(SUMMARY_STEPS, (step: { title; icon }, i) => {
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
					)?.some((token: Token) => {
						return token.type === TOKEN_TYPE_INPUT;
					});
					disabled = !hasInputs;
				}

				return (
					<div
						key={i + 1}
						className={`flex items-center rounded-md p-2 ${
							disabled
								? "cursor-default text-gray-400"
								: isStepComplete
									? "cursor-pointer text-green-600"
									: "cursor-pointer text-gray-900"
						} ${
							isActive
								? "bg-green-50"
								: !disabled
									? "hover:bg-gray-100"
									: ""
						}`}
						onClick={() => {
							if (!disabled) {
								props.changeBuilderStep(i + 1);
							}
						}}
					>
						<div
							className={`mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-white ${
								isActive ? "text-gray-900" : "text-inherit"
							}`}
						>
							<step.icon className="h-5 w-5" />
						</div>
						<span
							className={`flex-1 text-sm font-bold ${
								isActive ? "text-gray-900" : "text-inherit"
							}`}
						>
							{step.title}
						</span>
						{isStepComplete ? (
							<CheckCircle
								className={`mt-1 h-5 w-5 ${
									isActive ? "text-gray-900" : "text-green-600"
								}`}
							/>
						) : (
							<Clock className="mt-1 h-5 w-5 text-gray-400" />
						)}
					</div>
				);
			})}
		</nav>
	);
};
