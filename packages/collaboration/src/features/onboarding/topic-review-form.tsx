import { ArrowRight, Plus, RotateCcw } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	Button,
	Form,
	P,
	Spinner,
	useFieldArray,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import type { OnboardingStepProps } from "./onboarding-step-props";
import { Failure, message, StepActions, StepHeader } from "./onboarding-ui";
import { TopicCombineDialog } from "./topic-combine-dialog";
import { TopicEvidenceDialog } from "./topic-evidence-dialog";
import { TopicOrganizationContext } from "./topic-organization-context";
import { TopicOrganizationPreviewDialog } from "./topic-organization-preview-dialog";
import { TopicOrganizationProposalDialog } from "./topic-organization-proposal-dialog";
import { TopicProfileConflicts } from "./topic-profile-conflicts";
import {
	applyTopicReview,
	reviewDraft,
	type TopicReview,
	type TopicReviewDraft,
	topicReviewApplySchema,
} from "./topic-review-api";
import { TopicReviewCard } from "./topic-review-card";
import { useTopicOrganization } from "./use-topic-organization";
import { useTopicReviewChanges } from "./use-topic-review-changes";
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
	const [expandedKey, setExpandedKey] = useState<string | null>(
		initialReview.draft.topics.find((topic) => topic.keep)?.key ??
			initialReview.draft.topics[0]?.key ??
			null,
	);
	const [focusRequest, setFocusRequest] = useState<{
		key: string;
		field: "name" | "description" | "short" | "terms";
	} | null>(null);
	const controller = useTopicReviewDraft(actions, initialReview);
	const changes = useTopicReviewChanges(actions, controller, form);
	const organization = useTopicOrganization(
		actions,
		controller,
		form,
		changes,
	);
	const inspectPrefix = useId();
	const organizationTriggerId = `${inspectPrefix}-organize`;
	const [combineKey, setCombineKey] = useState<string | null>(null);
	const [inspection, setInspection] = useState<{
		key: string;
		trigger: HTMLButtonElement;
	} | null>(null);
	const [isOpeningEvidence, setIsOpeningEvidence] = useState(false);
	const { queueDraft } = controller;
	const values = form.watch();
	const { errors, isSubmitting } = form.formState;
	const [isGoingBack, setIsGoingBack] = useState(false);
	const [isReloading, setIsReloading] = useState(false);
	const isBusy =
		isSubmitting ||
		isGoingBack ||
		isReloading ||
		changes.isChanging ||
		isOpeningEvidence ||
		organization.isAsking ||
		organization.isOpening;
	const inspectedTopic = values.topics.find(
		(topic) => topic.key === inspection?.key,
	);
	const latestChange = controller.review.draft.history?.at(-1);
	const kept = values.topics.filter((topic) => topic.keep).length;
	const combinedKeys = new Set(
		controller.review.draft.topics
			.filter((topic) => topic.mergedIntoKey)
			.map((topic) => topic.key),
	);
	const availableTopics = values.topics.filter(
		(topic) => topic.keep && !combinedKeys.has(topic.key),
	);
	const combineTopic = availableTopics.find(
		(topic) => topic.key === combineKey,
	);
	const error = errors.root?.server?.message || controller.error;

	useEffect(() => {
		const subscription = form.watch(() => {
			if (!isReloading) queueDraft(form.getValues());
		});
		return () => subscription.unsubscribe();
	}, [form, queueDraft, isReloading]);

	useEffect(() => {
		if (!focusRequest) return;
		const index = fields.findIndex(
			(topic) => topic.key === focusRequest.key,
		);
		if (index < 0) return;
		form.setFocus(`topics.${index}.${focusRequest.field}`);
		setFocusRequest(null);
	}, [fields, focusRequest, form]);

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
			changes.reset();
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

	const handleInspect = async (
		key: string,
		trigger: HTMLButtonElement,
	): Promise<void> => {
		setIsOpeningEvidence(true);
		try {
			await controller.flushDraft(form.getValues());
			setInspection({ key, trigger });
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: message(cause),
			});
		} finally {
			setIsOpeningEvidence(false);
		}
	};

	return (
		<>
			<Form
				form={form}
				onSubmit={handleSubmit}
				onError={(validation) => {
					const index = values.topics.findIndex(
						(_, item) => validation.topics?.[item],
					);
					const topic = values.topics[index];
					if (!topic) return;
					const issue = validation.topics?.[index];
					const field = issue?.name
						? "name"
						: issue?.description
							? "description"
							: issue?.terms
								? "terms"
								: "short";
					setExpandedKey(topic.key);
					setFocusRequest({ key: topic.key, field });
				}}
				noValidate
				aria-busy={isBusy}
				className="flex min-w-0 flex-col gap-6"
			>
				<StepHeader eyebrow={eyebrow} title="What your work is about">
					Start with the projects, clients or areas you want to track.
					Keep broad topics that fit how you work, and combine
					overlapping suggestions.
				</StepHeader>
				<TopicOrganizationContext
					isBusy={
						isBusy ||
						!!changes.error ||
						availableTopics.length === 0 ||
						controller.review.profileConflicts.length > 0
					}
					isAsking={organization.isAsking}
					hasProposal={!!organization.proposal}
					error={organization.error}
					onAsk={() => void organization.ask()}
					onShowProposal={organization.showProposal}
					triggerId={organizationTriggerId}
				/>
				<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
					<P>
						{kept} {kept === 1 ? "topic" : "topics"} kept
						<span className="text-muted-foreground">
							{" "}
							· {fields.length - combinedKeys.size} to review
							{combinedKeys.size > 0
								? ` · ${combinedKeys.size} combined`
								: ""}
						</span>
					</P>
					<output className="text-muted-foreground">
						{controller.status === "saved"
							? "Draft saved"
							: controller.status === "error"
								? "Draft not saved"
								: "Saving draft…"}
					</output>
				</div>
				{controller.review.profileConflicts.length > 0 && (
					<TopicProfileConflicts
						conflicts={controller.review.profileConflicts}
						topics={values.topics}
						isBusy={isBusy || !!changes.error}
						onChoose={(conflict, choice) =>
							void changes.change({
								type: "reconcile_profile",
								topicKey: conflict.topicKey,
								profileVersion: conflict.profileVersion,
								choice,
							})
						}
					/>
				)}
				{latestChange && (
					<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
						<output className="break-words text-sm">
							{changes.isChanging
								? "Saving review change…"
								: `${controller.review.draft.lastChange || "Review changes saved"}. These take effect when you save this setup.`}
						</output>
						{latestChange && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={isBusy || !!changes.error}
								onClick={() =>
									void changes.change({
										type: "undo",
										changeId: latestChange.id,
									})
								}
							>
								<RotateCcw aria-hidden="true" /> Undo last
								change
							</Button>
						)}
					</div>
				)}
				{controller.review.draft.modelError && (
					<div className="text-muted-foreground text-sm">
						<P>
							Topic suggestions are unavailable right now. You can
							still add your own topics.
						</P>
						<details className="mt-2">
							<summary className="cursor-pointer">
								Suggestion details
							</summary>
							<span>{controller.review.draft.modelError}</span>
						</details>
					</div>
				)}
				{fields.length === 0 && (
					<P className="text-muted-foreground text-sm">
						No topics found. Add a topic or continue without topics.
					</P>
				)}
				<P className="text-muted-foreground text-xs">
					Examples explain the suggestions. Conversations are filed
					after you save your topics.
				</P>
				<div className="flex min-w-0 flex-col gap-3">
					{fields.map((field, index) => {
						const topic = values.topics[index];
						if (!topic || combinedKeys.has(topic.key)) return null;
						return (
							<TopicReviewCard
								key={field.id}
								evidence={controller.review.draft.topics.find(
									(item) => item.key === topic.key,
								)}
								value={topic}
								index={index}
								isExpanded={topic.key === expandedKey}
								onToggle={() =>
									setExpandedKey(
										topic.key === expandedKey
											? null
											: topic.key,
									)
								}
								onCombine={() => setCombineKey(topic.key)}
								isSubmitting={isBusy}
								inspectId={`${inspectPrefix}-inspect-${topic.key}`}
								onInspect={(trigger) =>
									void handleInspect(topic.key, trigger)
								}
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
					onClick={() => {
						const key = `added-${crypto.randomUUID()}`;
						setExpandedKey(key);
						setFocusRequest({ key, field: "name" });
						append(
							{
								key,
								id: null,
								name: "",
								description: "",
								short: "",
								terms: "",
								keep: true,
								removedPeople: [],
							},
							{ shouldFocus: false },
						);
					}}
					className="self-start"
				>
					<Plus aria-hidden="true" /> Add a topic
				</Button>
				{changes.error && (
					<div className="space-y-2">
						<Failure
							error={changes.error}
							onRetry={isBusy ? undefined : changes.retry}
						/>
						<Button
							type="button"
							variant="outline"
							disabled={isBusy}
							onClick={() => void handleReload()}
						>
							Reload saved review
						</Button>
					</div>
				)}
				{error && (
					<div className="space-y-2">
						<Failure
							error={error}
							onRetry={isBusy ? undefined : handleRetry}
						/>
						<P className="text-muted-foreground text-sm">
							Your entered values remain here. Reloading replaces
							them with the saved review.
						</P>
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
					<Button
						type="submit"
						size="lg"
						disabled={
							isBusy ||
							!!changes.error ||
							controller.review.profileConflicts.length > 0
						}
					>
						{isSubmitting && <Spinner className="size-4" />}
						{isSubmitting
							? "Saving topics…"
							: `Keep ${kept} topics`}
						<ArrowRight aria-hidden="true" />
					</Button>
				</StepActions>
			</Form>
			{combineTopic && !organization.preview && (
				<TopicCombineDialog
					key={combineTopic.key}
					topics={availableTopics}
					topic={combineTopic}
					isBusy={isBusy}
					error={organization.error}
					triggerId={organizationTriggerId}
					onPreview={organization.openPreview}
					onClose={() => setCombineKey(null)}
				/>
			)}
			{organization.proposal &&
				organization.isProposalOpen &&
				!organization.preview && (
					<TopicOrganizationProposalDialog
						key={organization.proposal.revision}
						proposal={organization.proposal}
						topics={availableTopics}
						isBusy={isBusy}
						isStale={organization.isProposalStale}
						error={organization.error}
						triggerId={organizationTriggerId}
						onPreview={organization.openPreview}
						onClose={organization.closeProposal}
					/>
				)}
			{organization.preview && (
				<TopicOrganizationPreviewDialog
					preview={organization.preview}
					isBusy={changes.isChanging}
					error={changes.error || organization.error}
					triggerId={organizationTriggerId}
					onAccept={() => void organization.acceptPreview()}
					onClose={organization.closePreview}
				/>
			)}
			{inspection && inspectedTopic && (
				<TopicEvidenceDialog
					key={inspection.key}
					actions={actions}
					review={controller.review}
					topics={values.topics}
					topic={inspectedTopic}
					trigger={inspection.trigger}
					triggerId={`${inspectPrefix}-inspect-${inspection.key}`}
					isChanging={changes.isChanging}
					isReloading={isReloading}
					changeError={changes.error}
					onChange={(change) => void changes.change(change)}
					onRetry={changes.retry}
					onReload={() => void handleReload()}
					onClose={() => setInspection(null)}
				/>
			)}
		</>
	);
}
