import { Trash2 } from "lucide-react";
import { useId } from "react";
import {
	Button,
	Checkbox,
	cn,
	FieldError,
	FieldLabel,
	FormField,
	Input,
	useFormContext,
} from "@semoss/ui/next";
import type { JevPolicyGuardrailFormValues } from "./jev-policy-guardrail";

/**
 * The columns of a choice's row from sm up: its name, what it means, whether
 * it blocks, and remove. The list's column headings use the same columns.
 */
export const CHOICE_COLUMN_CLASSES =
	"sm:grid sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto_2rem] sm:items-start";

/** Props for {@link JevPolicyChoiceRow}. */
export interface JevPolicyChoiceRowProps {
	/** The choice's place in the list. */
	index: number;
	/** Whether the choice is locked, as it is while the form saves. */
	disabled?: boolean;
	/** Called when the choice's remove button is pressed. */
	onRemove: () => void;
}

/**
 * One choice of a Jev policy guardrail's choice question: the name the judge
 * answers with, what it means, whether picking it blocks the call, and a
 * button that removes it. On a narrow screen the controls stack. Problems
 * show once the form is submitted.
 */
export const JevPolicyChoiceRow = ({
	index,
	disabled = false,
	onRemove,
}: JevPolicyChoiceRowProps) => {
	const { control, watch } = useFormContext<JevPolicyGuardrailFormValues>();
	const nameErrorId = useId();
	const descriptionErrorId = useId();
	const blockingId = useId();
	const number = index + 1;
	const choiceName = (watch(`CHOICES.${index}.name`) ?? "").trim();
	const choiceLabel = choiceName
		? `the ${choiceName} choice`
		: `choice ${number}`;

	return (
		<div className={cn("flex flex-col gap-2", CHOICE_COLUMN_CLASSES)}>
			<FormField
				control={control}
				name={`CHOICES.${index}.name`}
				render={({ field, fieldState }) => (
					<div className="flex min-w-0 flex-col gap-1">
						<Input
							{...field}
							aria-label={`Choice ${number} name`}
							aria-invalid={!!fieldState.error}
							aria-describedby={
								fieldState.error ? nameErrorId : undefined
							}
							placeholder="APPROVED"
							spellCheck={false}
							autoComplete="off"
							disabled={disabled}
						/>
						{fieldState.error?.message && (
							<FieldError id={nameErrorId}>
								{fieldState.error.message}
							</FieldError>
						)}
					</div>
				)}
			/>
			<FormField
				control={control}
				name={`CHOICES.${index}.description`}
				render={({ field, fieldState }) => (
					<div className="flex min-w-0 flex-col gap-1">
						<Input
							{...field}
							aria-label={`Choice ${number} meaning`}
							aria-invalid={!!fieldState.error}
							aria-describedby={
								fieldState.error
									? descriptionErrorId
									: undefined
							}
							placeholder="The answer shares only approved figures"
							autoComplete="off"
							disabled={disabled}
						/>
						{fieldState.error?.message && (
							<FieldError id={descriptionErrorId}>
								{fieldState.error.message}
							</FieldError>
						)}
					</div>
				)}
			/>
			<FormField
				control={control}
				name={`CHOICES.${index}.isBlocking`}
				render={({ field }) => (
					<div className="flex min-h-9 items-center gap-2">
						<Checkbox
							ref={field.ref}
							id={blockingId}
							name={field.name}
							checked={field.value}
							onCheckedChange={(checked) =>
								field.onChange(checked === true)
							}
							onBlur={field.onBlur}
							disabled={disabled}
							aria-label={`Choice ${number} blocks the call`}
						/>
						<FieldLabel
							htmlFor={blockingId}
							className="font-normal"
						>
							Blocks
						</FieldLabel>
					</div>
				)}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="self-end sm:self-auto"
				onClick={onRemove}
				disabled={disabled}
				aria-label={`Remove ${choiceLabel}`}
			>
				<Trash2 aria-hidden />
			</Button>
		</div>
	);
};
