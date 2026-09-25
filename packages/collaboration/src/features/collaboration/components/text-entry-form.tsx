import { useId } from "react";
import {
	Button,
	Form,
	FormInput,
	FormTextarea,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

const schema = z.object({ text: z.string().trim().min(1, "Enter some text.") });

/** A small, labelled form used for local goals, notes, and editable text. */
export function TextEntryForm({
	label,
	initialValue = "",
	submitLabel = "Add",
	multiline = false,
	onSave,
}: {
	label: string;
	initialValue?: string;
	submitLabel?: string;
	multiline?: boolean;
	/** Saves a session edit, preserving input if the operation fails. */
	onSave: (text: string) => void;
}) {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { text: initialValue },
	});
	const errorId = useId();
	const error = form.formState.errors.text?.message;
	return (
		<Form
			form={form}
			noValidate
			className="space-y-2"
			onSubmit={({ text }) => {
				onSave(text);
				form.reset({ text: submitLabel === "Add" ? "" : text });
			}}
		>
			{multiline ? (
				<FormTextarea
					name="text"
					label={label}
					required
					aria-describedby={error ? errorId : undefined}
				/>
			) : (
				<FormInput
					name="text"
					label={label}
					required
					aria-describedby={error ? errorId : undefined}
				/>
			)}
			{error && (
				<span id={errorId} className="sr-only">
					{error}
				</span>
			)}
			<Button type="submit" variant="outline" size="sm">
				{submitLabel}
			</Button>
		</Form>
	);
}
