import { useId } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	Field,
	FieldError,
	FieldLabel,
	Form,
	FormField,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type {
	ReviewAnswer,
	ReviewQuestion,
	ReviewTopic,
} from "./brain-review-api";

const filingSchema = z.object({
	topicId: z.string().min(1, "Choose a topic to continue."),
});
const labels = {
	unassigned: "No confirmed topic",
	wrong_topic: "Requested topic change",
	topic_choice: "Brain suggestion",
	new_topic: "New topic",
	merge_topic: "Possible merge",
	quiet_topic: "Quiet topic",
	add_person: "Topic membership",
	unknown_sender: "Frequent sender",
	memory: "Memory",
};
interface BrainReviewQuestionProps {
	question: ReviewQuestion;
	topics: ReviewTopic[];
	isBusy: boolean;
	/** Applies only the answer explicitly selected by the owner. */
	onAnswer: (action: ReviewAnswer, topicId?: string) => Promise<boolean>;
}

/** A question keeps all filing choices inline, including conversations with no suggested topic. */
export function BrainReviewQuestion({
	question,
	topics,
	isBusy,
	onAnswer,
}: BrainReviewQuestionProps) {
	const id = useId();
	const isFiling = ["unassigned", "wrong_topic", "topic_choice"].includes(
		question.kind,
	);
	const title = isFiling
		? (question.data.subject ??
			question.text.replace(/^Correct filing:\s*/, ""))
		: question.text;
	const explanation =
		question.kind === "wrong_topic"
			? "You requested a topic change for this thread. Choose its new topic below. Nothing changes until you save."
			: question.kind === "unassigned"
				? "This thread has no confirmed topic. Select where it belongs."
				: question.kind === "topic_choice"
					? "Brain suggested the topics below. Choose where this thread belongs."
					: question.detail;
	const form = useForm<z.infer<typeof filingSchema>>({
		resolver: zodResolver(filingSchema),
		defaultValues: { topicId: question.data.suggestedTopic ?? "" },
	});
	const needsPicker =
		question.kind === "unassigned" ||
		question.kind === "unknown_sender" ||
		question.kind === "wrong_topic";
	const choices = question.data.candidates.flatMap((topicId) => {
		const topic = topics.find((row) => row.id === topicId);
		return topic ? [topic] : [];
	});
	const topic = topics.find((row) => row.id === question.data.suggestedTopic);
	const label =
		question.kind === "new_topic"
			? "Create topic"
			: question.kind === "merge_topic"
				? "Merge topics"
				: question.kind === "quiet_topic"
					? "Archive topic"
					: question.kind === "memory"
						? question.data.memoryAction === "confirm"
							? "Confirm memory"
							: "Keep memory"
						: "Add to topic";
	return (
		<article
			aria-labelledby={`${id}-title`}
			className="min-w-0 space-y-3 border-b px-4 py-4 md:px-6"
		>
			<Badge variant="secondary">{labels[question.kind]}</Badge>
			<P
				id={`${id}-title`}
				className="break-words font-semibold text-base"
			>
				{title}
			</P>
			{explanation && (
				<P className="break-words text-muted-foreground text-sm">
					{explanation}
				</P>
			)}
			{question.kind === "wrong_topic" && (
				<dl className="rounded-md bg-muted/40 px-3 py-2 text-sm">
					<dt className="text-muted-foreground">
						Currently filed under
					</dt>
					<dd className="mt-1 font-medium">
						{question.data.currentTopics?.length
							? question.data.currentTopics
									.map((row) => row.name)
									.join(", ")
							: "Current topic unavailable. Refresh Review to load it."}
					</dd>
				</dl>
			)}

			{topic && (
				<P className="text-muted-foreground text-sm">
					Topic: {topic.name}
				</P>
			)}
			{needsPicker ? (
				<Form
					form={form}
					onSubmit={async (values) => {
						await onAnswer("accept", values.topicId);
					}}
					noValidate
					className="flex flex-wrap items-end gap-3"
				>
					<FormField
						control={form.control}
						name="topicId"
						render={({ field, fieldState }) => (
							<Field
								className="min-w-0 flex-1 basis-60"
								data-invalid={Boolean(fieldState.error)}
							>
								<FieldLabel htmlFor={`${id}-topic`}>
									{question.kind === "wrong_topic"
										? "New topic"
										: "Pick a topic"}
								</FieldLabel>
								<Select
									value={field.value}
									onValueChange={field.onChange}
									disabled={isBusy || topics.length === 0}
								>
									<SelectTrigger
										id={`${id}-topic`}
										ref={field.ref}
										onBlur={field.onBlur}
										aria-invalid={Boolean(fieldState.error)}
										aria-describedby={
											fieldState.error
												? `${id}-error`
												: undefined
										}
										className="min-h-11 w-full"
									>
										<SelectValue
											placeholder={
												question.kind === "wrong_topic"
													? "Select a replacement topic"
													: "Choose a topic"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{topics.map((row) => (
											<SelectItem
												key={row.id}
												value={row.id}
											>
												{row.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{fieldState.error && (
									<FieldError id={`${id}-error`}>
										{fieldState.error.message}
									</FieldError>
								)}
							</Field>
						)}
					/>
					<Button
						type="submit"
						disabled={isBusy || topics.length === 0}
						className="min-h-11"
					>
						{question.kind === "unassigned"
							? "File thread"
							: question.kind === "wrong_topic"
								? "Save topic change"
								: "Add to topic"}
					</Button>
					<Button
						type="button"
						variant="ghost"
						disabled={isBusy}
						onClick={() => void onAnswer("dismiss")}
						className="min-h-11"
					>
						{question.kind === "wrong_topic"
							? "Cancel request"
							: "Dismiss"}
					</Button>
					{topics.length === 0 && (
						<P className="w-full text-muted-foreground text-sm">
							No active topics yet. Optimize Brain can suggest
							topics from related conversations.
						</P>
					)}
				</Form>
			) : (
				<div className="flex flex-wrap gap-2">
					{question.kind === "topic_choice" ? (
						<>
							{choices.map((row) => (
								<Button
									key={row.id}
									variant="outline"
									disabled={isBusy}
									onClick={() =>
										void onAnswer("accept", row.id)
									}
									className="min-h-11"
								>
									File under {row.name}
								</Button>
							))}
							{choices.length > 1 && (
								<Button
									variant="outline"
									disabled={isBusy}
									onClick={() => void onAnswer("both")}
									className="min-h-11"
								>
									Both topics
								</Button>
							)}
							{choices.length === 0 && (
								<P className="text-muted-foreground text-sm">
									The candidate topics have changed. Dismiss
									this question and optimize again.
								</P>
							)}
						</>
					) : (
						<Button
							variant="outline"
							disabled={isBusy}
							onClick={() =>
								void onAnswer(
									"accept",
									question.data.suggestedTopic,
								)
							}
							className="min-h-11"
						>
							{label}
						</Button>
					)}
					<Button
						variant="ghost"
						disabled={isBusy}
						onClick={() => void onAnswer("dismiss")}
						className="min-h-11"
					>
						{question.kind === "wrong_topic"
							? "Cancel request"
							: "Dismiss"}
					</Button>
				</div>
			)}
			{(question.kind === "unassigned" ||
				question.kind === "topic_choice") && (
				<Link
					to={`/brain/threads/${encodeURIComponent(question.refId)}`}
					className="inline-flex min-h-11 items-center text-muted-foreground text-sm underline-offset-4 hover:underline"
				>
					View conversation context
				</Link>
			)}
		</article>
	);
}
