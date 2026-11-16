import { Plus, Trash2 } from "lucide-react";
import {
	Button,
	FormTextarea,
	useFieldArray,
	useFormContext,
} from "@semoss/ui/next";
import { MAX_STYLE_EXAMPLES, type StyleFormValues } from "./style-form-values";

interface StyleExamplesFieldProps {
	name: "examples" | "internal.examples" | "external.examples";
	/** What the examples are for, used to name each field and button. */
	label: string;
	disabled?: boolean;
}

/** An editable list of short examples of the owner's writing. */
export function StyleExamplesField({
	name,
	label,
	disabled,
}: StyleExamplesFieldProps) {
	const { control } = useFormContext<StyleFormValues>();
	const { fields, append, remove } = useFieldArray({ control, name });
	return (
		<div className="space-y-3">
			{fields.map((field, index) => (
				<div key={field.id} className="flex items-start gap-2">
					<FormTextarea
						className="min-w-0 flex-1"
						name={`${name}.${index}.text`}
						label={`${label} ${index + 1}`}
						rows={3}
						disabled={disabled}
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="mt-6 size-11"
						aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
						disabled={disabled}
						onClick={() => remove(index)}
					>
						<Trash2 aria-hidden="true" />
					</Button>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				disabled={disabled || fields.length >= MAX_STYLE_EXAMPLES}
				onClick={() => append({ text: "" })}
			>
				<Plus aria-hidden="true" />
				Add {label.toLowerCase()}
			</Button>
		</div>
	);
}
