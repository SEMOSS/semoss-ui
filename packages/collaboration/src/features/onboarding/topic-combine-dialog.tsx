import { useId } from "react";
import {
	Button,
	Checkbox,
	DialogFooter,
	Field,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Form,
	FormField,
	FormInput,
	FormSelect,
	FormTextarea,
	P,
	SelectItem,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { Failure } from "./onboarding-ui";
import { topicClues, topicCluesSchema } from "./topic-clues";
import type { TopicOrganizationGroup } from "./topic-organization-schema";
import type { TopicDraft } from "./topic-review-api";
import { TopicReviewDialog } from "./topic-review-dialog";

const combineSchema = z
	.object({
		choices: z.array(z.object({ key: z.string(), selected: z.boolean() })),
		targetKey: z.string(),
		name: z.string().trim().min(1, "Name this topic").max(255),
		description: z.string().max(12000),
		terms: topicCluesSchema,
	})
	.superRefine((value, context) => {
		const selected = value.choices.filter((choice) => choice.selected);
		if (selected.length < 2)
			context.addIssue({
				code: "custom",
				path: ["choices"],
				message: "Choose at least two topics to combine",
			});
		if (!selected.some((choice) => choice.key === value.targetKey))
			context.addIssue({
				code: "custom",
				path: ["targetKey"],
				message: "Retain one of the selected topic profiles",
			});
	});
type CombineValues = z.infer<typeof combineSchema>;

interface TopicCombineDialogProps {
	topics: TopicDraft[];
	topic: TopicDraft;
	isBusy: boolean;
	error: string | null;
	triggerId: string;
	onPreview: (groups: TopicOrganizationGroup[]) => Promise<boolean>;
	onClose: () => void;
}

/** Direct owner-selected combination remains available without a model. */
export function TopicCombineDialog({
	topics,
	topic,
	isBusy,
	error,
	triggerId,
	onPreview,
	onClose,
}: TopicCombineDialogProps) {
	const form = useForm<CombineValues>({
		resolver: zodResolver(combineSchema),
		defaultValues: {
			choices: topics.map((candidate) => ({
				key: candidate.key,
				selected: candidate.key === topic.key,
			})),
			targetKey: topic.key,
			name: topic.name,
			description: topic.description,
			terms: topic.terms,
		},
	});
	const choices = form.watch("choices");
	const choicesError =
		form.formState.errors.choices?.message ??
		form.formState.errors.choices?.root?.message;
	const choicesErrorId = useId();
	const handleSubmit = async (values: CombineValues): Promise<void> => {
		if (
			await onPreview([
				{
					topicKeys: values.choices
						.filter((choice) => choice.selected)
						.map((choice) => choice.key),
					targetKey: values.targetKey,
					name: values.name,
					description: values.description,
					terms: values.terms,
				},
			])
		)
			onClose();
	};
	return (
		<TopicReviewDialog
			title="Combine overlapping topics"
			description="Choose the suggestions that belong to the same area of work. Name the resulting scope, then preview what would move."
			isBusy={isBusy}
			triggerId={triggerId}
			onClose={onClose}
		>
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isBusy}
				className="space-y-4"
			>
				<FieldSet
					className="gap-2"
					aria-describedby={choicesError ? choicesErrorId : undefined}
					aria-invalid={!!choicesError}
				>
					<FieldLegend>Topics that belong together</FieldLegend>
					{topics.map((candidate, index) => (
						<FormField
							key={candidate.key}
							control={form.control}
							name={`choices.${index}.selected`}
							render={({ field }) => (
								<Field orientation="horizontal">
									<Checkbox
										id={`${choicesErrorId}-${index}`}
										ref={field.ref}
										checked={field.value}
										onBlur={field.onBlur}
										disabled={
											isBusy ||
											candidate.key === topic.key
										}
										aria-invalid={!!choicesError}
										aria-describedby={
											choicesError
												? choicesErrorId
												: undefined
										}
										onCheckedChange={(isChecked) => {
											field.onChange(isChecked === true);
											if (
												form.getFieldState("terms")
													.isDirty
											)
												return;
											const selected = form
												.getValues("choices")
												.filter(
													(choice) => choice.selected,
												)
												.map((choice) => choice.key);
											const clues = topics
												.filter((item) =>
													selected.includes(item.key),
												)
												.flatMap((item) =>
													topicClues(item.terms),
												);
											form.setValue(
												"terms",
												topicClues(
													clues.join("\n"),
												).join("\n"),
											);
										}}
									/>
									<FieldLabel
										htmlFor={`${choicesErrorId}-${index}`}
									>
										{candidate.name || "New topic"}
									</FieldLabel>
								</Field>
							)}
						/>
					))}
					{choicesError && (
						<P
							id={choicesErrorId}
							role="alert"
							className="text-destructive text-sm"
						>
							{choicesError}
						</P>
					)}
				</FieldSet>
				<FormSelect
					name="targetKey"
					label="Profile to retain"
					disabled={isBusy}
				>
					{topics
						.filter((candidate) =>
							choices.some(
								(choice) =>
									choice.key === candidate.key &&
									choice.selected,
							),
						)
						.map((candidate) => (
							<SelectItem
								key={candidate.key}
								value={candidate.key}
							>
								{candidate.name || "New topic"}
							</SelectItem>
						))}
				</FormSelect>
				<FormInput
					name="name"
					label="Combined topic name"
					required
					maxLength={255}
					disabled={isBusy}
				/>
				<FormTextarea
					name="description"
					label="What the combined topic covers"
					rows={3}
					maxLength={12000}
					disabled={isBusy}
				/>
				<FormTextarea
					name="terms"
					label="Project names and other clues (optional)"
					rows={2}
					maxLength={4000}
					disabled={isBusy}
					description="One distinctive project or client alias per line."
				/>
				{error && <Failure error={error} />}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isBusy}
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isBusy}>
						{isBusy && <Spinner className="size-4" />}
						{isBusy ? "Preparing preview…" : "Preview combination"}
					</Button>
				</DialogFooter>
			</Form>
		</TopicReviewDialog>
	);
}
