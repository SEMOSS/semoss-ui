import type { ReactNode } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	FieldDescription,
	FieldLegend,
	FieldSet,
	Form,
	FormTextarea,
	Spinner,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { StyleExamplesField } from "./style-examples-field";
import {
	fromStyleFormValues,
	type StyleDraft,
	type StyleFormValues,
	styleFormSchema,
	toStyleFormValues,
} from "./style-form-values";

interface StyleFormProps {
	/** The style to review; the form mounts with it, so key the form by what it was read from. */
	draft: StyleDraft;
	submitLabel: string;
	/** Receives the agreed style. Reject with a user-presentable error to keep the form open. */
	onSubmit: (draft: StyleDraft) => Promise<void> | void;
	/** An extra action beside the submit button, such as discarding a proposal. */
	secondary?: ReactNode;
}

/** Edit a writing style: the general style with examples, and optional internal and external variants. */
export function StyleForm({
	draft,
	submitLabel,
	onSubmit,
	secondary,
}: StyleFormProps) {
	const form = useForm<StyleFormValues>({
		resolver: zodResolver(styleFormSchema),
		defaultValues: toStyleFormValues(draft),
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async (values: StyleFormValues): Promise<void> => {
		try {
			await onSubmit(fromStyleFormValues(values));
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message:
					error instanceof Error
						? error.message
						: "Unable to save your style",
			});
		}
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSubmitting}
			className="space-y-6"
		>
			<FieldSet>
				<FieldLegend variant="label">General style</FieldLegend>
				<FieldDescription>
					Optional. Used for every draft unless a more specific style
					below applies.
				</FieldDescription>
				<FormTextarea
					name="summary"
					label="How you write"
					rows={4}
					disabled={isSubmitting}
				/>
				<StyleExamplesField
					name="examples"
					label="Example"
					disabled={isSubmitting}
				/>
			</FieldSet>
			<FieldSet>
				<FieldLegend variant="label">
					Colleagues in your organisation
				</FieldLegend>
				<FieldDescription>
					Optional. Used when every recipient is in your organisation.
				</FieldDescription>
				<FormTextarea
					name="internal.summary"
					label="How you write to colleagues"
					rows={3}
					disabled={isSubmitting}
				/>
				<StyleExamplesField
					name="internal.examples"
					label="Colleague example"
					disabled={isSubmitting}
				/>
			</FieldSet>
			<FieldSet>
				<FieldLegend variant="label">
					People outside your organisation
				</FieldLegend>
				<FieldDescription>
					Optional. Used when any recipient is outside your
					organisation.
				</FieldDescription>
				<FormTextarea
					name="external.summary"
					label="How you write to people outside"
					rows={3}
					disabled={isSubmitting}
				/>
				<StyleExamplesField
					name="external.examples"
					label="Outside example"
					disabled={isSubmitting}
				/>
			</FieldSet>
			{errors.root?.server?.message && (
				<Alert variant="destructive">
					<AlertDescription>
						{errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-col gap-2 sm:flex-row">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Spinner className="size-4" />}
					{submitLabel}
				</Button>
				{secondary}
			</div>
		</Form>
	);
}
