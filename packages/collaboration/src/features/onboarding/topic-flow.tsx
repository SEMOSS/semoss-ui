import { ArrowRight, MessageSquare, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
	Button,
	cn,
	Form,
	Sheet,
	SheetContent,
	SheetTitle,
	Spinner,
	useFieldArray,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { listPeople, type OnboardingPerson } from "./onboarding-api";
import type { OnboardingStepProps } from "./onboarding-step-props";
import { Failure, message, StepActions, StepHeader } from "./onboarding-ui";
import { TopicAreasStage } from "./topic-areas-stage";
import { TopicConversationsStage } from "./topic-conversations-stage";
import { TopicDoneStage } from "./topic-done-stage";
import { TopicOrganizationPreviewDialog } from "./topic-organization-preview-dialog";
import { TopicPeopleStage } from "./topic-people-stage";
import {
	applyTopicReview,
	reviewDraft,
	setTopicArea,
	type TopicReview,
	type TopicReviewDraft,
	topicClues,
	topicReviewApplySchema,
} from "./topic-review-api";
import type { SetupChange } from "./topic-setup-api";
import { TopicSetupChat } from "./topic-setup-chat";
import { useTopicOrganization } from "./use-topic-organization";
import { useTopicReviewChanges } from "./use-topic-review-changes";
import { useTopicReviewDraft } from "./use-topic-review-draft";

const STAGES = [
	{
		key: "areas",
		label: "Topics",
		title: "Your main areas of work",
		intro: "Keep the ones that are your work. Show more if something is missing.",
	},
	{
		key: "people",
		label: "People",
		title: "Who belongs on each topic",
		intro: "Click a name to take that person off a topic. Add anyone who is missing.",
	},
	{
		key: "conversations",
		label: "Conversations",
		title: "Check the conversations",
		intro: "Uncheck anything that does not belong, or move it to the right topic.",
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
	const [stage, setStage] = useState<TopicStage>("areas");
	const [revealed, setRevealed] = useState(5);
	const [contacts, setContacts] = useState<OnboardingPerson[]>([]);
	const [addedNames, setAddedNames] = useState<Record<string, string>>({});
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [isRegrouping, setIsRegrouping] = useState(false);
	const [isGoingBack, setIsGoingBack] = useState(false);
	const [isReloading, setIsReloading] = useState(false);
	const [navSlot, setNavSlot] = useState<HTMLDivElement | null>(null);
	const chatTriggerId = useId();
	const { queueDraft } = controller;
	const values = form.watch();
	const { errors, isSubmitting } = form.formState;
	const review = controller.review;
	// the newest draft, also mid-handler after a regroup the next render has not shown yet
	const reviewRef = useRef(review);
	reviewRef.current = review;
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
			reviewRef.current.draft.topics
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
			reviewRef.current.draft.topics
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
				...seed,
			},
			{ shouldFocus: false },
		);
		return key;
	};

	// a chat proposal becomes an ordinary draft edit the owner can still change
	const applyChange = async (change: SetupChange): Promise<boolean> => {
		if (change.type === "split_area" || change.type === "join_area") {
			const area = reviewRef.current.draft.areas.find(
				(item) => item.key === change.areaKey,
			);
			if (!area || area.split === (change.type === "split_area"))
				return false;
			return regroup(change.areaKey, change.type === "split_area");
		}
		if (change.type === "add_topic") {
			if (form.getValues("topics").length >= 100) return false;
			rememberNames(change.addPeople);
			addTopic({
				name: change.name,
				description: [change.description, change.note]
					.filter(Boolean)
					.join(" "),
				terms: change.addTerms.join("\n"),
				addedPeople: change.addPeople.map((person) => person.id),
			});
			return true;
		}
		if (change.type === "combine") {
			const keys = change.topicKeys.filter((key) =>
				keptKeys.includes(key),
			);
			if (keys.length < 2) return false;
			const targetKey =
				keys.find(
					(key) =>
						reviewRef.current.draft.topics.find(
							(t) => t.key === key,
						)?.accepted,
				) ?? keys[0];
			const target = form.getValues(`topics.${indexOf(targetKey)}`);
			return organization.openPreview([
				{
					topicKeys: keys,
					targetKey,
					name: change.name || target.name,
					description: change.description || target.description,
					terms: target.terms,
				},
			]);
		}
		const index = indexOf(change.topicKey);
		if (
			index < 0 ||
			reviewRef.current.draft.topics.some(
				(topic) => topic.key === change.topicKey && topic.mergedIntoKey,
			)
		)
			return false;
		if (change.type === "keep" || change.type === "skip") {
			const isAccepted = reviewRef.current.draft.topics.find(
				(t) => t.key === change.topicKey,
			)?.accepted;
			if (change.type === "skip" && isAccepted) return false;
			form.setValue(`topics.${index}.keep`, change.type === "keep", {
				shouldDirty: true,
			});
			return true;
		}
		if (change.name)
			form.setValue(`topics.${index}.name`, change.name, {
				shouldDirty: true,
			});
		if (change.description)
			form.setValue(`topics.${index}.description`, change.description, {
				shouldDirty: true,
			});
		// a note adds to what the description already says
		const described = form.getValues(`topics.${index}.description`);
		if (change.note && !described.includes(change.note))
			form.setValue(
				`topics.${index}.description`,
				[described.trim(), change.note].filter(Boolean).join(" "),
				{ shouldDirty: true },
			);
		if (change.addTerms.length) {
			const current = form.getValues(`topics.${index}.terms`);
			const have = new Set(
				topicClues(current).map((t) => t.toLowerCase()),
			);
			const extra = change.addTerms.filter(
				(t) => t.trim() && !have.has(t.trim().toLowerCase()),
			);
			if (extra.length)
				form.setValue(
					`topics.${index}.terms`,
					[current.trim(), ...extra].filter(Boolean).join("\n"),
					{ shouldDirty: true },
				);
		}
		if (change.addPeople.length)
			addPeople(change.topicKey, change.addPeople);
		if (change.removePeople.length)
			removePeople(
				change.topicKey,
				change.removePeople.map((person) => person.id),
			);
		return true;
	};

	const regroup = async (
		areaKey: string,
		split: boolean,
	): Promise<boolean> => {
		setIsRegrouping(true);
		try {
			const saved = await controller.flushDraft(form.getValues());
			const next = await setTopicArea(actions, saved, areaKey, split);
			controller.acceptReview(next);
			reviewRef.current = next;
			form.reset(reviewDraft(next));
			return true;
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: message(cause),
			});
			return false;
		} finally {
			setIsRegrouping(false);
		}
	};

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
							className="flex flex-wrap gap-1 text-xs"
						>
							{STAGES.map((item, index) => (
								<li
									key={item.key}
									aria-current={
										item.key === stage ? "step" : undefined
									}
									className={cn(
										"rounded-full px-2.5 py-1",
										item.key === stage
											? "bg-primary text-primary-foreground"
											: index < stageIndex
												? "bg-primary/10 text-primary"
												: "bg-muted text-muted-foreground",
									)}
								>
									{item.label}
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
				) : stage === "areas" ? (
					<TopicAreasStage
						review={review}
						values={values}
						revealed={revealed}
						isBusy={isBusy}
						onReveal={setRevealed}
						onRegroup={(areaKey, split) =>
							void regroup(areaKey, split)
						}
						onAddTopic={(name) => addTopic({ name })}
					/>
				) : stage === "people" ? (
					<TopicPeopleStage
						actions={actions}
						review={review}
						values={values}
						keys={keptKeys}
						contacts={contacts}
						addedNames={addedNames}
						isBusy={isBusy}
						onAdd={addPeople}
						onRemove={removePeople}
					/>
				) : stage === "conversations" ? (
					<TopicConversationsStage
						actions={actions}
						review={review}
						values={values}
						keys={keptKeys}
						isBusy={isBusy}
						changes={changes}
						onSave={() => controller.flushDraft(form.getValues())}
						onDone={() => setStage("done")}
						navSlot={navSlot}
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
					<Button
						id={chatTriggerId}
						type="button"
						variant="outline"
						disabled={noSuggestions}
						onClick={() => setIsChatOpen(true)}
					>
						<MessageSquare aria-hidden="true" /> Ask the assistant
					</Button>
					{stage === "done" ? (
						<Button
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
					) : stage !== "conversations" ? (
						<Button
							type="button"
							disabled={isBusy || noSuggestions}
							onClick={() => setStage(STAGES[stageIndex + 1].key)}
						>
							Next: {STAGES[stageIndex + 1].label.toLowerCase()}
							<ArrowRight aria-hidden="true" />
						</Button>
					) : (
						<div
							ref={setNavSlot}
							className="flex flex-wrap gap-2"
						/>
					)}
				</StepActions>
			</Form>
			<Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
				<SheetContent className="w-full gap-0 p-0 sm:max-w-md">
					<SheetTitle className="sr-only">Setup assistant</SheetTitle>
					<TopicSetupChat
						actions={actions}
						reviewId={review.id}
						topics={values.topics
							.filter((topic) => !combined.has(topic.key))
							.map((topic) => ({
								key: topic.key,
								name: topic.name,
							}))}
						isBusy={isBusy}
						onSave={() => controller.flushDraft(form.getValues())}
						onApply={applyChange}
						onOwnerWords={(text) =>
							form.setValue("guidance", text, {
								shouldDirty: true,
							})
						}
						className="h-full rounded-none border-0 bg-background"
					/>
				</SheetContent>
			</Sheet>
			{organization.preview && (
				<TopicOrganizationPreviewDialog
					preview={organization.preview}
					isBusy={changes.isChanging}
					error={changes.error || organization.error}
					triggerId={chatTriggerId}
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
