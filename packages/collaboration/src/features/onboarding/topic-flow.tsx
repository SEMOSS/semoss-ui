import { ArrowRight, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
	Button,
	Form,
	Spinner,
	useFieldArray,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { listPeople, type OnboardingPerson } from "./onboarding-api";
import type { OnboardingStepProps } from "./onboarding-step-props";
import { Failure, message, StepActions, StepHeader } from "./onboarding-ui";
import { TopicAreasStage } from "./topic-areas-stage";
import { TopicBuilder } from "./topic-builder";
import { TopicDoneStage } from "./topic-done-stage";
import { TopicOrganizationPreviewDialog } from "./topic-organization-preview-dialog";
import {
	applyTopicReview,
	reviewDraft,
	setTopicArea,
	type TopicReview,
	type TopicReviewDraft,
	topicReviewApplySchema,
} from "./topic-review-api";
import { useTopicOrganization } from "./use-topic-organization";
import { useTopicReviewChanges } from "./use-topic-review-changes";
import { useTopicReviewDraft } from "./use-topic-review-draft";

const STAGES = [
	{
		key: "build",
		label: "Set up",
		title: "Your main areas of work",
		intro: "Set up each topic with Brain: what it is, who is on it, and the conversations that belong.",
	},
	{
		key: "areas",
		label: "Check",
		title: "Check your topics",
		intro: "Pick a topic to see what is in it. Tick two or more to combine them.",
	},
	{
		key: "done",
		label: "Done",
		title: "Ready to file",
		intro: "Brain files your recent mail and chats into these topics.",
	},
] as const;
export type TopicStage = (typeof STAGES)[number]["key"];

interface TopicFlowProps extends OnboardingStepProps {
	/** Server draft loaded before mounting the flow. */
	initialReview: TopicReview;
	/** Ask the server for a fresh draft after its suggestions failed. */
	onRestart: () => void;
}

/** Topics in short steps: pick areas, check people, check conversations, then save. */
export function TopicFlow({
	actions,
	onNext,
	onBack,
	eyebrow,
	initialReview,
	onRestart,
}: TopicFlowProps) {
	const form = useForm<TopicReviewDraft>({
		resolver: zodResolver(topicReviewApplySchema),
		defaultValues: reviewDraft(initialReview),
	});
	const { append } = useFieldArray({ control: form.control, name: "topics" });
	const controller = useTopicReviewDraft(actions, initialReview);
	const changes = useTopicReviewChanges(actions, controller, form);
	const organization = useTopicOrganization(
		actions,
		controller,
		form,
		changes,
	);
	const [stage, setStage] = useState<TopicStage>("build");
	const [contacts, setContacts] = useState<OnboardingPerson[]>([]);
	const [addedNames, setAddedNames] = useState<Record<string, string>>({});
	const [isRegrouping, setIsRegrouping] = useState(false);
	const [isGoingBack, setIsGoingBack] = useState(false);
	const [isReloading, setIsReloading] = useState(false);
	const previewTriggerId = useId();
	// why the last layout or combination could not be used, when it failed before its preview
	const layoutFailure = useRef<string | null>(null);
	const { queueDraft } = controller;
	const values = form.watch();
	const { errors, isSubmitting } = form.formState;
	const review = controller.review;
	const isBusy =
		isSubmitting ||
		isGoingBack ||
		isReloading ||
		isRegrouping ||
		changes.isChanging ||
		organization.isOpening;
	const error = errors.root?.server?.message || controller.error;
	const meta = STAGES.find((item) => item.key === stage) ?? STAGES[0];
	const stageIndex = STAGES.findIndex((item) => item.key === stage);

	// combined parts stay out of every list; areas come first, in their order
	const combined = new Set(
		review.draft.topics
			.filter((topic) => topic.mergedIntoKey)
			.map((topic) => topic.key),
	);
	const inArea = new Set(
		review.draft.areas.flatMap((area) => area.topicKeys),
	);
	const ordered = [
		...values.topics
			.filter(
				(topic) =>
					!inArea.has(topic.key) && !topic.key.startsWith("added-"),
			)
			.map((topic) => topic.key),
		...review.draft.areas.flatMap((area) =>
			area.split ? area.topicKeys : area.topicKeys.slice(0, 1),
		),
		...values.topics
			.filter((topic) => topic.key.startsWith("added-"))
			.map((topic) => topic.key),
	].filter((key) => !combined.has(key));
	const keptKeys = ordered.filter(
		(key) => values.topics.find((topic) => topic.key === key)?.keep,
	);

	useEffect(() => {
		const subscription = form.watch(() => {
			if (!isReloading) queueDraft(form.getValues());
		});
		return () => subscription.unsubscribe();
	}, [form, queueDraft, isReloading]);

	// VIPs and followed people first, then the strongest contacts
	useEffect(() => {
		let isCurrent = true;
		Promise.all([
			listPeople(actions, { follow: "following" }).catch(() => []),
			listPeople(actions).catch(() => []),
		]).then(([followed, strongest]) => {
			if (!isCurrent) return;
			const seen = new Set<string>();
			setContacts(
				[
					...followed.filter((p) => p.vip),
					...followed,
					...strongest,
				].filter(
					(p) => !p.automated && !seen.has(p.id) && !!seen.add(p.id),
				),
			);
		});
		return () => {
			isCurrent = false;
		};
	}, [actions]);

	// each stage starts at the top
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs on each stage change
	useEffect(() => {
		window.scrollTo({ top: 0 });
	}, [stage]);

	const indexOf = (key: string) =>
		form.getValues("topics").findIndex((topic) => topic.key === key);

	const rememberNames = useCallback(
		(people: { id: string; name: string }[]) =>
			setAddedNames((current) => ({
				...current,
				...Object.fromEntries(people.map((p) => [p.id, p.name])),
			})),
		[],
	);

	const addPeople = (key: string, people: { id: string; name: string }[]) => {
		const index = indexOf(key);
		if (index < 0) return;
		const topic = form.getValues(`topics.${index}`);
		const known = new Set(
			review.draft.topics
				.find((item) => item.key === key)
				?.people.map((person) => person.id) ?? [],
		);
		rememberNames(people);
		// someone already on the suggestion is restored rather than added twice
		form.setValue(
			`topics.${index}.removedPeople`,
			topic.removedPeople.filter(
				(id) => !people.some((person) => person.id === id),
			),
			{ shouldDirty: true },
		);
		form.setValue(
			`topics.${index}.addedPeople`,
			[
				...new Set([
					...topic.addedPeople,
					...people.map((p) => p.id).filter((id) => !known.has(id)),
				]),
			],
			{ shouldDirty: true },
		);
	};

	const removePeople = (key: string, ids: string[]) => {
		const index = indexOf(key);
		if (index < 0) return;
		const topic = form.getValues(`topics.${index}`);
		const known = new Set(
			review.draft.topics
				.find((item) => item.key === key)
				?.people.map((person) => person.id) ?? [],
		);
		form.setValue(
			`topics.${index}.addedPeople`,
			topic.addedPeople.filter((id) => !ids.includes(id)),
			{ shouldDirty: true },
		);
		form.setValue(
			`topics.${index}.removedPeople`,
			[
				...new Set([
					...topic.removedPeople,
					...ids.filter((id) => known.has(id)),
				]),
			],
			{ shouldDirty: true },
		);
	};

	const addTopic = (
		seed: Partial<TopicReviewDraft["topics"][number]> = {},
	): string => {
		const key = `added-${crypto.randomUUID()}`;
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
				addedPeople: [],
				fileFromFolder: false,
				...seed,
			},
			{ shouldFocus: false },
		);
		return key;
	};

	// whole areas split before their parts combine with other topics: an area's first topic does not save once
	// combined into another; the saved review after splitting, or null with the reason kept
	const splitAreas = async (
		areaKeys: string[],
	): Promise<TopicReview | null> => {
		setIsRegrouping(true);
		try {
			let saved = await controller.flushDraft(form.getValues());
			for (const areaKey of areaKeys) {
				saved = await setTopicArea(actions, saved, areaKey, true);
				controller.acceptReview(saved);
				form.reset(reviewDraft(saved));
			}
			return saved;
		} catch (cause: unknown) {
			layoutFailure.current = message(cause);
			return null;
		} finally {
			setIsRegrouping(false);
		}
	};

	// kept topics into one, keeping a saved topic's profile when there is one; opens a preview first
	const combineTopics = async (
		topicKeys: string[],
		name = "",
		description = "",
	): Promise<boolean> => {
		layoutFailure.current = null;
		if (new Set(topicKeys).size < 2) return false;
		let current = review;
		const toSplit = current.draft.areas
			.filter(
				(area) =>
					!area.split &&
					area.topicKeys.length > 1 &&
					topicKeys.some((key) => area.topicKeys.includes(key)),
			)
			.map((area) => area.key);
		if (toSplit.length) {
			const next = await splitAreas(toSplit);
			if (!next) return false;
			current = next;
		}
		// a split area comes in whole; a skipped topic comes in when combined
		const merged = new Set(
			current.draft.topics
				.filter((topic) => topic.mergedIntoKey)
				.map((topic) => topic.key),
		);
		const keys = [
			...new Set(
				topicKeys.flatMap(
					(key) =>
						current.draft.areas.find(
							(area) =>
								toSplit.includes(area.key) &&
								area.topicKeys.includes(key),
						)?.topicKeys ?? [key],
				),
			),
		].filter((key) => indexOf(key) >= 0 && !merged.has(key));
		if (keys.length < 2) return false;
		const targetKey =
			keys.find(
				(key) =>
					current.draft.topics.find((t) => t.key === key)?.accepted,
			) ?? keys[0];
		const target = form.getValues(`topics.${indexOf(targetKey)}`);
		// the server only combines kept topics: keep the skipped ones for now, and put them back if the preview fails
		const brought = keys.filter(
			(key) => !form.getValues(`topics.${indexOf(key)}.keep`),
		);
		for (const key of brought)
			form.setValue(`topics.${indexOf(key)}.keep`, true, {
				shouldDirty: true,
			});
		const opened = await organization.openPreview([
			{
				topicKeys: keys,
				targetKey,
				name: name || target.name,
				description: description || target.description,
				terms: target.terms,
			},
		]);
		if (!opened)
			for (const key of brought)
				form.setValue(`topics.${indexOf(key)}.keep`, false, {
					shouldDirty: true,
				});
		return opened;
	};

	// leaving the builder: only the topics the owner set up stay kept; Brain's other groups wait under "Also found"
	const finishBuild = (): void => {
		const built = new Set(
			review.draft.topics.filter((t) => t.built).map((t) => t.key),
		);
		form.getValues("topics").forEach((topic, index) => {
			const saved = review.draft.topics.find((t) => t.key === topic.key);
			if (topic.keep && !built.has(topic.key) && !saved?.accepted)
				form.setValue(`topics.${index}.keep`, false, {
					shouldDirty: true,
				});
		});
		setStage("areas");
	};

	const regroup = async (areaKey: string, split: boolean): Promise<void> => {
		setIsRegrouping(true);
		try {
			const saved = await controller.flushDraft(form.getValues());
			const next = await setTopicArea(actions, saved, areaKey, split);
			controller.acceptReview(next);
			form.reset(reviewDraft(next));
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: message(cause),
			});
		} finally {
			setIsRegrouping(false);
		}
	};

	const handleSubmit = async (draft: TopicReviewDraft): Promise<void> => {
		if (stage !== "done") return;
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
		if (stageIndex > 0) {
			setStage(STAGES[stageIndex - 1].key);
			return;
		}
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
			form.clearErrors("root.server");
			if (stage === "done") void form.handleSubmit(handleSubmit)();
			else
				void controller
					.flushDraft(form.getValues())
					.catch(() => undefined);
		} else {
			void controller.flushDraft(form.getValues()).catch(() => undefined);
		}
	};

	const noSuggestions =
		review.draft.topics.length === 0 && review.draft.modelError !== "";

	return (
		<>
			<Form
				form={form}
				onSubmit={handleSubmit}
				onError={() => {
					if (stage !== "done") return;
					// the only check is a name on every kept topic, edited on the first stage
					setStage("areas");
					form.setError("root.server", {
						type: "server",
						message:
							"Name every kept topic, or turn off Keep, before saving.",
					});
				}}
				noValidate
				aria-busy={isBusy}
				className="flex min-w-0 flex-col gap-5"
			>
				<StepHeader
					eyebrow={eyebrow}
					title={meta.title}
					aside={
						<ol
							aria-label="Topic steps"
							className="flex flex-wrap gap-3 text-xs"
						>
							{STAGES.map((item, index) => (
								<li
									key={item.key}
									aria-current={
										item.key === stage ? "step" : undefined
									}
									className={
										item.key === stage
											? "font-semibold text-foreground"
											: "text-muted-foreground"
									}
								>
									{index + 1}. {item.label}
								</li>
							))}
						</ol>
					}
				>
					{meta.intro}
				</StepHeader>
				{noSuggestions ? (
					<Failure
						error={review.draft.modelError}
						onRetry={onRestart}
					/>
				) : stage === "build" ? (
					<TopicBuilder
						actions={actions}
						review={review}
						contacts={contacts}
						changes={changes}
						isBusy={isBusy}
						onSave={() => controller.flushDraft(form.getValues())}
						onRemove={(key) => {
							form.setValue(
								`topics.${indexOf(key)}.keep`,
								false,
								{ shouldDirty: true },
							);
							return controller.flushDraft(form.getValues());
						}}
						onDone={finishBuild}
						onBack={() => void handleBack()}
					/>
				) : stage === "areas" ? (
					<TopicAreasStage
						actions={actions}
						contacts={contacts}
						changes={changes}
						onSave={() => controller.flushDraft(form.getValues())}
						onReload={handleReload}
						review={review}
						values={values}
						addedNames={addedNames}
						isBusy={isBusy}
						onRegroup={(areaKey, split) =>
							void regroup(areaKey, split)
						}
						onCombine={(keys) =>
							void combineTopics(keys).then((opened) => {
								if (!opened && layoutFailure.current)
									form.setError("root.server", {
										type: "server",
										message: layoutFailure.current,
									});
							})
						}
						onAddTopic={(name) => addTopic({ name })}
						onRemovePeople={removePeople}
						onRestorePeople={addPeople}
					/>
				) : (
					<TopicDoneStage
						review={review}
						values={values}
						keys={keptKeys}
						isBusy={isBusy}
						changes={changes}
						onEdit={setStage}
					/>
				)}
				{organization.error && !organization.preview && (
					<Failure error={organization.error} />
				)}
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
							<RotateCcw aria-hidden="true" /> Reload saved topics
						</Button>
					</div>
				)}
				{error && (
					<div className="space-y-2">
						<Failure
							error={error}
							onRetry={isBusy ? undefined : handleRetry}
						/>
						<Button
							type="button"
							variant="outline"
							disabled={isBusy || controller.status === "saving"}
							onClick={() => void handleReload()}
						>
							<RotateCcw aria-hidden="true" /> Reload saved topics
						</Button>
					</div>
				)}
				{(stage !== "build" || noSuggestions) && (
					<StepActions
						onBack={isBusy ? undefined : () => void handleBack()}
						note={
							<output>
								{controller.status === "saved"
									? `${keptKeys.length} ${keptKeys.length === 1 ? "topic" : "topics"} kept`
									: controller.status === "error"
										? "Not saved"
										: "Saving..."}
							</output>
						}
					>
						{stage === "done" ? (
							<Button
								key="apply-topics"
								type="submit"
								disabled={
									isBusy ||
									!!changes.error ||
									review.profileConflicts.length > 0
								}
							>
								{isSubmitting && <Spinner className="size-4" />}
								{isSubmitting
									? "Saving topics..."
									: `Save ${keptKeys.length} ${keptKeys.length === 1 ? "topic" : "topics"}`}
								<ArrowRight aria-hidden="true" />
							</Button>
						) : (
							<Button
								type="button"
								disabled={isBusy || noSuggestions}
								onClick={() =>
									setStage(STAGES[stageIndex + 1].key)
								}
							>
								Next:{" "}
								{STAGES[stageIndex + 1].label.toLowerCase()}
								<ArrowRight aria-hidden="true" />
							</Button>
						)}
					</StepActions>
				)}
			</Form>
			{organization.preview && (
				<TopicOrganizationPreviewDialog
					preview={organization.preview}
					isBusy={changes.isChanging}
					error={changes.error || organization.error}
					triggerId={previewTriggerId}
					onAccept={() => void organization.acceptPreview()}
					onClose={organization.closePreview}
				/>
			)}
			{isRegrouping && (
				<output className="sr-only">Regrouping topics</output>
			)}
		</>
	);
}
