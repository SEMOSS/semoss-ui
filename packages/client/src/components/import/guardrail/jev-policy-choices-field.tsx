import { Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
	Button,
	cn,
	FieldDescription,
	FieldError,
	FieldLegend,
	FieldSet,
	Muted,
	useFieldArray,
	useFormContext,
} from "@semoss/ui/next";
import {
	CHOICE_COLUMN_CLASSES,
	JevPolicyChoiceRow,
} from "./jev-policy-choice-row";
import type { JevPolicyGuardrailFormValues } from "./jev-policy-guardrail";

/** Props for {@link JevPolicyChoicesField}. */
export interface JevPolicyChoicesFieldProps {
	/** Whether the choices are locked, as they are while the form saves. */
	disabled?: boolean;
}

/**
 * The choices a Jev policy guardrail's judge picks from, each named, described
 * and marked when picking it blocks the call, added and removed in place.
 * Removing a choice moves focus to the choice that takes its place, or to Add
 * choice. Problems show once the form is submitted, including one for the
 * list as a whole when no choice blocks the call or every choice does.
 */
export const JevPolicyChoicesField = ({
	disabled = false,
}: JevPolicyChoicesFieldProps) => {
	const { control, formState, setFocus } =
		useFormContext<JevPolicyGuardrailFormValues>();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "CHOICES",
	});
	const descriptionId = useId();
	const listErrorId = useId();
	const addChoiceRef = useRef<HTMLButtonElement>(null);
	// the place of a choice just removed, whose neighbor gets focus once it is gone
	const [removedIndex, setRemovedIndex] = useState<number | null>(null);
	// a problem with the list as a whole sits on its root while it has choices
	const listError = formState.errors.CHOICES;
	const listMessage = listError?.root?.message ?? listError?.message;

	useEffect(() => {
		if (removedIndex === null) {
			return;
		}
		if (fields.length === 0) {
			addChoiceRef.current?.focus();
		} else {
			setFocus(
				`CHOICES.${Math.min(removedIndex, fields.length - 1)}.name`,
			);
		}
		setRemovedIndex(null);
	}, [removedIndex, fields.length, setFocus]);

	const handleRemove = (index: number) => {
		remove(index);
		setRemovedIndex(index);
	};

	return (
		<FieldSet
			aria-describedby={
				listMessage ? `${descriptionId} ${listErrorId}` : descriptionId
			}
		>
			<FieldLegend variant="label">Choices</FieldLegend>
			<FieldDescription id={descriptionId}>
				The answers the judge picks from, each with the name it answers
				with and what it means. Mark the choices that block the call;
				the others allow it.
			</FieldDescription>
			{fields.length === 0 ? (
				<Muted className="text-sm">No choices yet.</Muted>
			) : (
				<div className="flex flex-col gap-4 sm:gap-2">
					<div
						aria-hidden
						className={cn(
							"hidden gap-2 text-muted-foreground text-xs",
							CHOICE_COLUMN_CLASSES,
						)}
					>
						<span>Name</span>
						<span>Meaning</span>
						<span />
						<span />
					</div>
					{fields.map((choice, index) => (
						<JevPolicyChoiceRow
							key={choice.id}
							index={index}
							disabled={disabled}
							onRemove={() => handleRemove(index)}
						/>
					))}
				</div>
			)}
			{listMessage && (
				<FieldError id={listErrorId}>{listMessage}</FieldError>
			)}
			<div>
				<Button
					ref={addChoiceRef}
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						append({ name: "", description: "", isBlocking: false })
					}
					disabled={disabled}
				>
					<Plus aria-hidden />
					Add Choice
				</Button>
			</div>
		</FieldSet>
	);
};
