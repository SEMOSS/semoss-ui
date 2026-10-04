import { ArrowRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Form,
	Spinner,
	useFieldArray,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import type { OnboardingStepProps } from "./onboarding-step-props";
import { Failure, message, StepActions, StepHeader } from "./onboarding-ui";
import {
	applyTopicReview,
	reviewDraft,
	type TopicReview,
	type TopicReviewDraft,
	topicReviewApplySchema,
} from "./topic-review-api";
import { TopicReviewCard } from "./topic-review-card";
import { useTopicReviewDraft } from "./use-topic-review-draft";

interface TopicReviewFormProps extends OnboardingStepProps {
	/** Server draft loaded before mounting the editor. */
	initialReview: TopicReview;
}

/** Direct topic setup over the durable draft that later assistant/evidence tools will share. */
export function TopicReviewForm({
	actions,
	onNext,
	onBack,
	eyebrow,
	initialReview,
}: TopicReviewFormProps) {
	const form = useForm<TopicReviewDraft>({
		resolver: zodResolver(topicReviewApplySchema),
		defaultValues: reviewDraft(initialReview),
	});
	const { fields, append } = useFieldArray({
		control: form.control,
		name: "topics",
	});
	const controller = useTopicReviewDraft(actions, initialReview);
	const { queueDraft } = controller;
	const values = form.watch();
	const { errors, isSubmitting } = form.formState;
	const [isGoingBack, setIsGoingBack] = useState(false);
	const [isReloading, setIsReloading] = useState(false);
	const isBusy = isSubmitting || isGoingBack || isReloading;
	const kept = values.topics.filter((topic) => topic.keep).length;
	const error = errors.root?.server?.message || controller.error;

	useEffect(() => {
		const subscription = form.watch(() => {
			if (!isReloading) queueDraft(form.getValues());
		});
		return () => subscription.unsubscribe();
	}, [form, queueDraft, isReloading]);

	const handleSubmit = async (draft: TopicReviewDraft): Promise<void> => {
		try {
			const saved = await controller.flushDraft(draft);
			const applied = await applyTopicReview(actions, saved);
			controller.acceptReview(applied);
			form.reset(reviewDraft(applied));
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: message(cause),
			});
			return;
		}
		onNext();
	};

	const handleBack = async (): Promise<void> => {
		setIsGoingBack(true);
		try {
			await controller.flushDraft(form.getValues());
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: message(cause),
			});
			setIsGoingBack(false);
			return;
		}
		setIsGoingBack(false);
		onBack?.();
	};

	const handleReload = async (): Promise<void> => {
		setIsReloading(true);
		try {
			const saved = await controller.reloadSaved();
			form.reset(reviewDraft(saved));
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: message(cause),
			});
		} finally {
			setIsReloading(false);
		}
	};

	const handleRetry = (): void => {
		if (errors.root?.server) {
			void form.handleSubmit(handleSubmit)();
		} else {
			void controller.flushDraft(form.getValues()).catch(() => undefined);
		}
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isBusy}
			className="flex min-w-0 flex-col gap-6"
		>
			<StepHeader eyebrow={eyebrow} title="What your work is about">
				Choose the topics you want to track. Edit the suggestions or add
				your own.
			</StepHeader>
			<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
				<p>
					{kept} {kept === 1 ? "topic" : "topics"} kept
				</p>
				<output className="text-muted-foreground">
					{controller.status === "saved"
						? "Draft saved"
						: controller.status === "error"
							? "Draft not saved"
							: "Saving draft…"}
				</output>
			</div>
			{controller.review.draft.modelError && (
				<div className="text-muted-foreground text-sm">
					<p>
						Topic suggestions are unavailable right now. You can
						still add your own topics.
					</p>
					<details className="mt-2">
						<summary className="cursor-pointer">
							Suggestion details
						</summary>
						<span>{controller.review.draft.modelError}</span>
					</details>
				</div>
			)}
			{fields.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No topics found. Add a topic or continue without topics.
				</p>
			)}
			<p className="text-muted-foreground text-xs">
				Examples explain the suggestions. Conversations are filed after
				you save your topics.
			</p>
			<div className="grid min-w-0 gap-4 sm:grid-cols-2">
				{fields.map((field, index) => {
					const topic = values.topics[index];
					if (!topic) return null;
					return (
						<TopicReviewCard
							key={field.id}
							evidence={controller.review.draft.topics.find(
								(item) => item.key === topic.key,
							)}
							value={topic}
							index={index}
							isSubmitting={isBusy}
							onRemovePerson={(personId) =>
								form.setValue(
									`topics.${index}.removedPeople`,
									[
										...new Set([
											...topic.removedPeople,
											personId,
										]),
									],
									{ shouldDirty: true },
								)
							}
							onRestorePerson={(personId) =>
								form.setValue(
									`topics.${index}.removedPeople`,
									topic.removedPeople.filter(
										(id) => id !== personId,
									),
									{ shouldDirty: true },
								)
							}
						/>
					);
				})}
			</div>
			<Button
				type="button"
				variant="outline"
				disabled={isBusy || fields.length >= 100}
				onClick={() =>
					append(
						{
							key: `added-${crypto.randomUUID()}`,
							id: null,
							name: "",
							description: "",
							short: "",
							keep: true,
							removedPeople: [],
						},
						{ focusName: `topics.${fields.length}.name` },
					)
				}
				className="self-start"
			>
				<Plus aria-hidden="true" /> Add a topic
			</Button>
			{error && (
				<div className="space-y-2">
					<Failure
						error={error}
						onRetry={isBusy ? undefined : handleRetry}
					/>
					<p className="text-muted-foreground text-sm">
						Your entered values remain here. Reloading replaces them
						with the saved review.
					</p>
					<Button
						type="button"
						variant="outline"
						disabled={isBusy || controller.status === "saving"}
						onClick={() => void handleReload()}
					>
						Reload saved review
					</Button>
				</div>
			)}
			<StepActions>
				{onBack && (
					<Button
						type="button"
						variant="ghost"
						disabled={isBusy}
						onClick={() => void handleBack()}
					>
						{isGoingBack ? "Saving…" : "Back"}
					</Button>
				)}
				<Button type="submit" size="lg" disabled={isBusy}>
					{isSubmitting && <Spinner className="size-4" />}
					{isSubmitting ? "Saving topics…" : `Keep ${kept} topics`}
					<ArrowRight aria-hidden="true" />
				</Button>
			</StepActions>
		</Form>
	);
}
