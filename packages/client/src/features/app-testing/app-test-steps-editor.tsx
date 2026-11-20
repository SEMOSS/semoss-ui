import { useRef } from "react";
import { Button, useFieldArray, useFormContext } from "@semoss/ui/next";
import {
	type AppTestRecordingFormValues,
	newAppTestStep,
} from "./app-test-recording-form";
import { AppTestStepFields } from "./app-test-step-fields";
/** Shares field-array behavior between workflow and optional cleanup steps. */
export const AppTestStepsEditor = ({
	section,
}: {
	/** Editable workflow or cleanup array. */ section:
		| "steps"
		| "cleanupSteps";
}) => {
	const form = useFormContext<AppTestRecordingFormValues>();
	const array = useFieldArray({ control: form.control, name: section });
	const addButton = useRef<HTMLButtonElement | null>(null);
	const isCleanup = section === "cleanupSteps";
	const disabled = form.formState.isSubmitting;
	const label = isCleanup ? "cleanup step" : "step";
	return (
		<fieldset className="flex min-w-0 flex-col gap-4">
			<legend className="mb-2 font-medium text-sm">
				{isCleanup ? "Cleanup steps (optional)" : "Steps"}
			</legend>
			{isCleanup && (
				<p className="text-muted-foreground text-sm">
					Cleanup runs after the workflow even if it fails, within the
					remaining run budget. It is reported separately and does not
					add coverage.
				</p>
			)}
			{array.fields.map((step, index) => (
				<fieldset
					key={step.id}
					className="flex min-w-0 flex-col gap-3 border-t pt-3"
				>
					<legend className="font-medium text-sm">
						{isCleanup ? "Cleanup step" : "Step"} {index + 1}
					</legend>
					<AppTestStepFields index={index} section={section} />
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={disabled || index === 0}
							onClick={() => array.move(index, index - 1)}
							aria-label={`Move ${label} ${index + 1} up`}
						>
							Move up
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={
								disabled || index === array.fields.length - 1
							}
							onClick={() => array.move(index, index + 1)}
							aria-label={`Move ${label} ${index + 1} down`}
						>
							Move down
						</Button>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={
								disabled ||
								(!isCleanup && array.fields.length <= 1)
							}
							onClick={() => {
								array.remove(index);
								addButton.current?.focus();
							}}
							aria-label={`Remove ${label} ${index + 1}`}
						>
							Remove {label}
						</Button>
					</div>
				</fieldset>
			))}
			<Button
				ref={addButton}
				type="button"
				size="sm"
				variant="outline"
				className="self-start"
				disabled={
					disabled || array.fields.length >= (isCleanup ? 50 : 300)
				}
				onClick={() => array.append(newAppTestStep())}
			>
				Add {label}
			</Button>
		</fieldset>
	);
};
