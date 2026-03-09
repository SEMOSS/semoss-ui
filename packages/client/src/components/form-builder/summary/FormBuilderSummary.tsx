import { CheckCircleIcon, CircleIcon } from "lucide-react";
import {
	FORM_BUILDER_PREVIEW_STEP,
	FORM_BUILDER_STEPS,
} from "../form-builder.constants";
import type { FormBuilderState } from "../form-builder.types";

interface FormBuilderSummaryProps {
	currentStep: number;
	state: FormBuilderState;
	onStepClick: (step: number) => void;
}

/** Check whether enough data has been provided to consider a step complete */
function isStepComplete(step: number, state: FormBuilderState): boolean {
	switch (step) {
		case 1:
			return !!state.appName.trim();
		case 2:
			return !!state.databaseId && state.tables.length > 0;
		case 3:
			return state.tables.every((t) => t.operations.length > 0);
		case 4:
			return state.tables.every((t) =>
				t.operations.every((op) =>
					t.fields[op]?.some((f) => f.visible),
				),
			);
		case 5:
			return false; // preview is never "complete" — it's the final action
		default:
			return false;
	}
}

export const FormBuilderSummary = ({
	currentStep,
	state,
	onStepClick,
}: FormBuilderSummaryProps) => {
	// Calculate overall progress
	const completedSteps = FORM_BUILDER_STEPS.filter(
		(s) =>
			s.step < FORM_BUILDER_PREVIEW_STEP && isStepComplete(s.step, state),
	).length;
	const totalSteps = FORM_BUILDER_STEPS.length - 1; // exclude preview
	const pct = Math.round((completedSteps / totalSteps) * 100);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<span className="font-semibold text-sm">Form Builder</span>
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					<span>
						{completedSteps}/{totalSteps} steps
					</span>
					<span className="font-semibold text-primary">{pct}%</span>
				</div>
				<div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-1">
				{FORM_BUILDER_STEPS.map((stepInfo) => {
					const complete = isStepComplete(stepInfo.step, state);
					const active = stepInfo.step === currentStep;
					const canClick = stepInfo.step <= currentStep;

					return (
						<button
							key={stepInfo.step}
							type="button"
							disabled={!canClick}
							onClick={() =>
								canClick && onStepClick(stepInfo.step)
							}
							className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
								active
									? "bg-primary/10 font-medium text-primary"
									: canClick
										? "hover:bg-accent"
										: "cursor-default opacity-50"
							}`}
						>
							{complete ? (
								<CheckCircleIcon className="size-4 shrink-0 text-primary" />
							) : (
								<CircleIcon
									className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
								/>
							)}
							<div className="flex flex-col">
								<span>{stepInfo.title}</span>
								{active && (
									<span className="text-muted-foreground text-xs">
										{stepInfo.description}
									</span>
								)}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};
