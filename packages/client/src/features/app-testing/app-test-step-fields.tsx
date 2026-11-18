import { useRef } from "react";
import {
	Button,
	FormCheckbox,
	FormInput,
	FormSelect,
	FormSelectItem,
	FormTextarea,
	useFieldArray,
	useFormContext,
} from "@semoss/ui/next";
import {
	APP_TEST_ACTIONS,
	type AppTestRecordingFormValues,
} from "./app-test-recording-form";

interface AppTestStepFieldsProps {
	/** Position in the editable recording; field-array identities are owned by the dialog. */
	index: number;
}

/** Show only the controls needed by this step's action, plus optional route and iframe targets. */
export const AppTestStepFields = ({ index }: AppTestStepFieldsProps) => {
	const form = useFormContext<AppTestRecordingFormValues>();
	const name = `steps.${index}` as const;
	const type = form.watch(`${name}.type`);
	const hasPagePath = form.watch(`${name}.hasPagePath`);
	const frames = useFieldArray({
		control: form.control,
		name: `${name}.frames`,
	});
	const addFrameButton = useRef<HTMLButtonElement | null>(null);
	const disabled = form.formState.isSubmitting;
	return (
		<div className="flex min-w-0 flex-col gap-4">
			<FormSelect
				name={`${name}.type`}
				label="Action"
				disabled={disabled}
				triggerClassName="w-full"
			>
				{Object.entries(APP_TEST_ACTIONS).map(([value, label]) => (
					<FormSelectItem key={value} value={value}>
						{label}
					</FormSelectItem>
				))}
			</FormSelect>
			{type === "NAVIGATE" ? (
				<FormInput
					name={`${name}.path`}
					label="Destination page"
					description="Relative to this app. Leave empty for the app home page."
					disabled={disabled}
				/>
			) : (
				<FormInput
					name={`${name}.selector`}
					label="Target selector (required)"
					description={'For example, [data-testid="save-button"].'}
					required
					disabled={disabled}
				/>
			)}
			{["FILL", "SELECT"].includes(type) && (
				<FormTextarea
					name={`${name}.value`}
					label={type === "SELECT" ? "Option value" : "Field value"}
					disabled={disabled}
				/>
			)}
			{type === "ASSERT_TEXT" && (
				<>
					<FormTextarea
						name={`${name}.text`}
						label="Expected text (required)"
						required
						disabled={disabled}
					/>
					<FormCheckbox
						name={`${name}.exact`}
						label="Match the whole text exactly"
						disabled={disabled}
					/>
				</>
			)}
			{type === "CHECK" && (
				<FormCheckbox
					name={`${name}.checked`}
					label="Checkbox should be checked"
					disabled={disabled}
				/>
			)}
			{type === "KEY" && (
				<FormInput
					name={`${name}.key`}
					label="Key (required)"
					description="For example, Enter or Control+A."
					required
					disabled={disabled}
				/>
			)}
			{type === "SCROLL" && (
				<div className="grid min-w-0 gap-4 sm:grid-cols-2">
					<FormInput
						name={`${name}.x`}
						label="Horizontal position (required)"
						type="number"
						required
						disabled={disabled}
					/>
					<FormInput
						name={`${name}.y`}
						label="Vertical position (required)"
						type="number"
						required
						disabled={disabled}
					/>
				</div>
			)}
			<FormCheckbox
				name={`${name}.hasPagePath`}
				label="Wait for a page before this step"
				disabled={disabled}
			/>
			{hasPagePath && (
				<FormInput
					name={`${name}.pagePath`}
					label="Expected page"
					description="Relative page, including query/hash. Leave empty to wait for the app home page."
					disabled={disabled}
				/>
			)}
			<fieldset className="flex min-w-0 flex-col gap-2">
				<legend className="mb-2 text-sm">
					Nested iframe targets (optional)
				</legend>
				{frames.fields.map((frame, frameIndex) => (
					<div
						key={frame.id}
						className="flex min-w-0 flex-wrap items-end gap-2"
					>
						<FormInput
							name={`${name}.frames.${frameIndex}.selector`}
							label={`Frame ${frameIndex + 1} selector (required)`}
							className="min-w-0 flex-1"
							required
							disabled={disabled}
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={disabled}
							onClick={() => {
								frames.remove(frameIndex);
								addFrameButton.current?.focus();
							}}
							aria-label={`Remove frame ${frameIndex + 1} from step ${index + 1}`}
						>
							Remove frame
						</Button>
					</div>
				))}
				<Button
					ref={addFrameButton}
					type="button"
					size="sm"
					variant="outline"
					className="self-start"
					disabled={disabled || frames.fields.length >= 5}
					onClick={() => frames.append({ selector: "" })}
				>
					Add iframe target
				</Button>
			</fieldset>
		</div>
	);
};
