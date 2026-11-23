import type { ReactNode } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	FieldGroup,
	Form,
	FormTextarea,
	Spinner,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import {
	PERSONA_SECTIONS,
	type PersonaSections,
	personaSectionsSchema,
} from "./api/persona";

interface PersonaSectionsFormProps {
	/** The text each section starts with. */
	sections: PersonaSections;
	/**
	 * Saves the sections and answers with them as they were kept, which the
	 * boxes then show. Rejects with a reason a person can read when it cannot.
	 */
	onSave: (sections: PersonaSections) => Promise<PersonaSections>;
	/** What the save button says; "Save" when left out. */
	submitLabel?: string;
	/** More actions for the row the save button is in, before it. */
	children?: ReactNode;
}

/**
 * A persona's eight sections as plain text, one box each. Nothing is saved
 * until the button is pressed, and a save that fails keeps what was written.
 */
export function PersonaSectionsForm({
	sections,
	onSave,
	submitLabel = "Save",
	children,
}: PersonaSectionsFormProps) {
	const form = useForm<PersonaSections>({
		resolver: zodResolver(personaSectionsSchema),
		defaultValues: sections,
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async (values: PersonaSections): Promise<void> => {
		if (!Object.values(values).some((value) => value.trim())) {
			form.setError("root.server", {
				type: "server",
				message: "Write at least one section first.",
			});
			return;
		}
		let kept: PersonaSections;
		try {
			kept = await onSave(values);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "Your persona could not be saved.",
			});
			return;
		}
		// what was kept is the form's new starting point
		form.reset(kept);
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSubmitting}
			className="flex min-w-0 max-w-3xl flex-col gap-8"
		>
			<FieldGroup className="min-w-0">
				{PERSONA_SECTIONS.map((section) => (
					<FormTextarea
						key={section.key}
						name={section.key}
						label={section.label}
						description={section.hint}
						disabled={isSubmitting}
						rows={4}
					/>
				))}
			</FieldGroup>
			{errors.root?.server?.message && (
				<Alert variant="destructive">
					<AlertDescription>
						{errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
				{children}
				<Button
					type="submit"
					disabled={isSubmitting}
					className="pointer-coarse:min-h-11"
				>
					{isSubmitting && (
						<Spinner aria-hidden="true" data-icon="inline-start" />
					)}
					{isSubmitting ? "Saving…" : submitLabel}
				</Button>
			</div>
		</Form>
	);
}
