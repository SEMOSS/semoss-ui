import { Check, ChevronDown, Pencil, Plus, Undo2, X } from "lucide-react";
import { useId, useState } from "react";
import {
	Badge,
	Button,
	Checkbox,
	cn,
	FormCheckbox,
	Input,
	Label,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	useFormContext,
} from "@semoss/ui/next";
import { peoplePickerContentClassName } from "@/features/collaboration/components/people-picker-panel";
import { givenFirst } from "@/lib/person-name";
import type { InsightActions } from "@/lib/pixel";
import type { OnboardingPerson } from "./onboarding-api";
import { TopicConversationsPanel } from "./topic-conversations-panel";
import { DOT, topicPeople, topicSummary } from "./topic-flow-utils";
import { TopicPeoplePicker } from "./topic-people-picker";
import type {
	ReviewTopic,
	TopicArea,
	TopicReview,
	TopicReviewDraft,
} from "./topic-review-api";
import type { useTopicReviewChanges } from "./use-topic-review-changes";

interface TopicAreasStageProps {
	actions: InsightActions;
	contacts: OnboardingPerson[];
	changes: ReturnType<typeof useTopicReviewChanges>;
	/** Save the draft before reading or changing conversations. */
	onSave: () => Promise<TopicReview>;
	review: TopicReview;
	values: TopicReviewDraft;
	addedNames: Record<string, string>;
	isBusy: boolean;
	onRegroup: (areaKey: string, split: boolean) => void;
	onCombine: (keys: string[]) => void;
	onAddTopic: (name: string) => string;
	onRemovePeople: (key: string, ids: string[]) => void;
	onRestorePeople: (
		key: string,
		people: { id: string; name: string }[],
	) => void;
}

/** One row in the list: a topic, or an area still shown as one topic. */
interface Entry {
	key: string;
	area?: TopicArea;
	/** keys of the topics folded into this row while its area is whole */
	parts: string[];
	/** the area this topic was split out of */
	splitFrom?: TopicArea;
}

/** Topics as a short list; pick one to see and change what is in it. */
export function TopicAreasStage({
	actions,
	contacts,
	changes,
	onSave,
	review,
	values,
	addedNames,
	isBusy,
	onRegroup,
	onCombine,
	onAddTopic,
	onRemovePeople,
	onRestorePeople,
}: TopicAreasStageProps) {
	const form = useFormContext<TopicReviewDraft>();
	const addId = useId();
	const [newName, setNewName] = useState("");
	const [picked, setPicked] = useState<string[]>([]);
	const [showOthers, setShowOthers] = useState(false);
	const evidenceOf = (key: string) =>
		review.draft.topics.find((topic) => topic.key === key);
	const indexOf = (key: string) =>
		values.topics.findIndex((topic) => topic.key === key);
	const merged = new Set(
		review.draft.topics
			.filter((topic) => topic.mergedIntoKey)
			.map((topic) => topic.key),
	);
	const inArea = new Set(
		review.draft.areas.flatMap((area) => area.topicKeys),
	);

	const entries: Entry[] = [
		...values.topics
			.filter((t) => !inArea.has(t.key) && !t.key.startsWith("added-"))
			.map((t) => ({ key: t.key, parts: [] })),
		...review.draft.areas.flatMap((area): Entry[] =>
			area.topicKeys.length > 1 && !area.split
				? [{ key: area.topicKeys[0], area, parts: area.topicKeys }]
				: area.topicKeys.map((key) => ({
						key,
						area,
						parts: [],
						splitFrom: area.topicKeys.length > 1 ? area : undefined,
					})),
		),
		...values.topics
			.filter((t) => t.key.startsWith("added-"))
			.map((t) => ({ key: t.key, parts: [] })),
	].filter((entry) => !merged.has(entry.key) && indexOf(entry.key) >= 0);
	const kept = entries.filter((e) => values.topics[indexOf(e.key)]?.keep);
	const others = entries.filter((e) => !values.topics[indexOf(e.key)]?.keep);
	const [selected, setSelected] = useState<string | null>(null);
	const current =
		entries.find((e) => e.key === selected) ?? kept[0] ?? entries[0];

	const setKeep = (key: string, keep: boolean) =>
		form.setValue(`topics.${indexOf(key)}.keep`, keep, {
			shouldDirty: true,
		});

	const togglePick = (key: string) =>
		setPicked((list) =>
			list.includes(key) ? list.filter((k) => k !== key) : [...list, key],
		);

	const add = () => {
		const name = newName.trim();
		if (!name) return;
		setSelected(onAddTopic(name));
		setNewName("");
	};

	const row = (entry: Entry) => {
		const value = values.topics[indexOf(entry.key)];
		const evidence = evidenceOf(entry.key);
		const count = evidence?.threadIds.length ?? 0;
		const isCurrent = entry.key === current?.key;
		return (
			<li key={entry.key}>
				<div
					className={cn(
						"flex items-center gap-2.5 px-3 py-2.5 text-sm",
						isCurrent
							? "bg-primary/10 shadow-[inset_3px_0_0] shadow-primary"
							: "hover:bg-muted/50",
					)}
				>
					{value.keep && (
						<Checkbox
							aria-label={`Select ${value.name || "new topic"} to combine`}
							checked={picked.includes(entry.key)}
							disabled={isBusy}
							onCheckedChange={() => togglePick(entry.key)}
						/>
					)}
					<button
						type="button"
						className={cn(
							"flex min-w-0 flex-1 items-center gap-2 text-left",
							!value.keep && "text-muted-foreground",
						)}
						aria-current={isCurrent ? "true" : undefined}
						onClick={() => setSelected(entry.key)}
					>
						<span className="min-w-0 flex-1 truncate font-medium">
							{value.name || "New topic"}
						</span>
						{entry.parts.length > 1 && (
							<Badge variant="outline" className="font-normal">
								{entry.parts.length} parts
							</Badge>
						)}
						<span className="text-muted-foreground text-xs tabular-nums">
							{count || ""}
						</span>
					</button>
				</div>
			</li>
		);
	};

	// the latest conversation or grouping change can be taken back
	const lastChange = review.draft.lastChange
		? review.draft.history?.find(
				(item) => item.id === review.draft.lastChange,
			)
		: undefined;

	return (
		<div className="flex min-w-0 flex-col gap-3">
			{lastChange && (
				<output className="flex flex-wrap items-center gap-2 self-start rounded-md bg-muted px-3 py-1.5 text-sm">
					{lastChange.summary}
					<Button
						type="button"
						variant="link"
						size="sm"
						className="h-auto p-0"
						disabled={isBusy}
						onClick={() =>
							void changes.change({
								type: "undo",
								changeId: lastChange.id,
							})
						}
					>
						<Undo2 aria-hidden="true" /> Undo
					</Button>
				</output>
			)}
			<div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
				<div className="flex min-w-0 flex-col overflow-hidden rounded-lg border lg:sticky lg:top-4 lg:max-h-[calc(100dvh-9rem)]">
					<div className="flex items-center justify-between border-b px-3 py-2 text-muted-foreground text-xs">
						<span>
							{kept.length}{" "}
							{kept.length === 1 ? "topic" : "topics"} kept
						</span>
						<span>conversations</span>
					</div>
					{picked.length >= 2 && (
						<div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-3 py-2 text-sm">
							<span className="font-medium">
								{picked.length} selected
							</span>
							<Button
								type="button"
								size="sm"
								disabled={isBusy}
								onClick={() => {
									onCombine(picked);
									setPicked([]);
								}}
							>
								Combine into one
							</Button>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => setPicked([])}
							>
								Clear
							</Button>
						</div>
					)}
					<div className="min-h-0 flex-1 overflow-y-auto">
						<ul className="divide-y">{kept.map(row)}</ul>
						{others.length > 0 && (
							<>
								<button
									type="button"
									className="flex w-full items-center justify-between border-t bg-muted/40 px-3 py-2 text-left text-muted-foreground text-xs uppercase tracking-wide"
									aria-expanded={showOthers}
									onClick={() =>
										setShowOthers((open) => !open)
									}
								>
									Also found, not kept ({others.length})
									<ChevronDown
										className={cn(
											"size-3.5 transition-transform",
											showOthers && "rotate-180",
										)}
										aria-hidden="true"
									/>
								</button>
								{showOthers && (
									<ul className="divide-y border-t">
										{others.map(row)}
									</ul>
								)}
							</>
						)}
					</div>
					<div className="flex shrink-0 items-end gap-2 border-t p-3">
						<div className="flex-1 space-y-1">
							<Label htmlFor={addId} className="text-xs">
								Add a topic
							</Label>
							<Input
								id={addId}
								value={newName}
								maxLength={255}
								placeholder="For example, Hiring"
								disabled={isBusy}
								onChange={(event) =>
									setNewName(event.target.value)
								}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										add();
									}
								}}
							/>
						</div>
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label="Add topic"
							disabled={isBusy || !newName.trim()}
							onClick={add}
						>
							<Plus aria-hidden="true" />
						</Button>
					</div>
				</div>
				{current ? (
					<TopicDetail
						key={current.key}
						actions={actions}
						contacts={contacts}
						changes={changes}
						onSave={onSave}
						others={kept
							.filter((other) => other.key !== current.key)
							.map((other) => ({
								key: other.key,
								name:
									values.topics[indexOf(other.key)]?.name ||
									"New topic",
							}))}
						entry={current}
						review={review}
						values={values}
						addedNames={addedNames}
						isBusy={isBusy}
						evidenceOf={evidenceOf}
						indexOf={indexOf}
						onKeep={setKeep}
						onRegroup={onRegroup}
						onRemovePeople={onRemovePeople}
						onRestorePeople={onRestorePeople}
					/>
				) : (
					<P className="text-muted-foreground text-sm">
						No topics yet. Add one on the left.
					</P>
				)}
			</div>
		</div>
	);
}

interface TopicDetailProps {
	actions: InsightActions;
	contacts: OnboardingPerson[];
	changes: ReturnType<typeof useTopicReviewChanges>;
	/** Save the draft before reading or changing conversations. */
	onSave: () => Promise<TopicReview>;
	/** Kept topics a conversation can move to. */
	others: { key: string; name: string }[];
	entry: Entry;
	review: TopicReview;
	values: TopicReviewDraft;
	addedNames: Record<string, string>;
	isBusy: boolean;
	evidenceOf: (key: string) => ReviewTopic | undefined;
	indexOf: (key: string) => number;
	onKeep: (key: string, keep: boolean) => void;
	onRegroup: (areaKey: string, split: boolean) => void;
	onRemovePeople: (key: string, ids: string[]) => void;
	onRestorePeople: (
		key: string,
		people: { id: string; name: string }[],
	) => void;
}

/** Everything about one topic: its name, what it is made of, sample conversations and people. */
function TopicDetail({
	actions,
	contacts,
	changes,
	onSave,
	others,
	entry,
	review,
	values,
	addedNames,
	isBusy,
	evidenceOf,
	indexOf,
	onKeep,
	onRegroup,
	onRemovePeople,
	onRestorePeople,
}: TopicDetailProps) {
	const form = useFormContext<TopicReviewDraft>();
	const index = indexOf(entry.key);
	const value = values.topics[index];
	const evidence = evidenceOf(entry.key);
	const [renaming, setRenaming] = useState(false);
	const [draftName, setDraftName] = useState("");
	const [isAdding, setIsAdding] = useState(false);
	const { suggested, added } = topicPeople(evidence, value, addedNames);
	const isGroup = entry.parts.length > 1;
	const about = (isGroup ? entry.area?.about : "") || value.description;
	const count = evidence?.threadIds.length ?? 0;

	const saveName = () => {
		const name = draftName.trim();
		if (!name) return;
		form.setValue(`topics.${index}.name`, name, {
			shouldDirty: true,
			shouldValidate: true,
		});
		setRenaming(false);
	};

	return (
		<section
			aria-label={value.name || "New topic"}
			className="flex min-w-0 flex-col gap-4 rounded-lg border p-4 sm:p-5"
		>
			<div className="flex flex-wrap items-center gap-2">
				{renaming ? (
					<>
						<Input
							aria-label="Topic name"
							className="min-w-0 max-w-md flex-1 font-semibold"
							value={draftName}
							maxLength={255}
							autoFocus
							onChange={(event) =>
								setDraftName(event.target.value)
							}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									saveName();
								} else if (event.key === "Escape") {
									event.preventDefault();
									setRenaming(false);
								}
							}}
						/>
						<Button
							type="button"
							size="sm"
							disabled={!draftName.trim()}
							onClick={saveName}
						>
							<Check aria-hidden="true" /> Save
						</Button>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={() => setRenaming(false)}
						>
							<X aria-hidden="true" /> Cancel
						</Button>
					</>
				) : (
					<>
						<h2 className="min-w-0 flex-1 truncate font-semibold text-lg">
							{value.name || "New topic"}
						</h2>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isBusy}
							onClick={() => {
								setDraftName(value.name);
								setRenaming(true);
							}}
						>
							<Pencil aria-hidden="true" /> Rename
						</Button>
						<Button
							type="button"
							size="sm"
							variant={value.keep ? "outline" : "default"}
							disabled={
								isBusy || (value.keep && evidence?.accepted)
							}
							onClick={() => onKeep(entry.key, !value.keep)}
						>
							{value.keep ? "Not my work" : "Keep this topic"}
						</Button>
					</>
				)}
			</div>
			{form.formState.errors.topics?.[index]?.name && (
				<P className="text-destructive text-xs" role="alert">
					Name this topic or mark it Not my work.
				</P>
			)}
			<div className="space-y-1">
				{about && <P className="text-sm">{about}</P>}
				<P className="text-muted-foreground text-xs">
					{count
						? `${count} ${count === 1 ? "conversation" : "conversations"}`
						: evidence?.accepted
							? "Already saved"
							: "No conversations yet"}
					{evidence?.folders.length
						? ` ${DOT} mostly in ${evidence.folders.join(", ")}`
						: ""}
				</P>
			</div>

			{isGroup && entry.area && (
				<Block
					title={`Made of ${entry.parts.length} parts`}
					action={
						<Button
							type="button"
							variant="link"
							size="sm"
							className="h-auto p-0 text-xs"
							disabled={isBusy}
							onClick={() =>
								onRegroup(entry.area?.key ?? "", true)
							}
						>
							Keep these separate
						</Button>
					}
				>
					<ul className="flex flex-col gap-1.5">
						{entry.parts.map((key, position) => {
							const part = evidenceOf(key);
							const name =
								position === 0
									? (part?.own?.name ?? part?.name)
									: part?.name;
							return (
								<li
									key={key}
									className="rounded-md border px-3 py-2 text-sm"
								>
									<span className="font-medium">{name}</span>
									{part?.sampleSubjects[0] && (
										<span className="block truncate text-muted-foreground text-xs">
											e.g. {part.sampleSubjects[0]}
										</span>
									)}
								</li>
							);
						})}
					</ul>
				</Block>
			)}
			{entry.splitFrom && (
				<div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
					<span className="text-muted-foreground">
						Split out of {entry.splitFrom.name}
					</span>
					<Button
						type="button"
						variant="link"
						size="sm"
						className="h-auto p-0 text-xs"
						disabled={isBusy}
						onClick={() =>
							onRegroup(entry.splitFrom?.key ?? "", false)
						}
					>
						<Undo2 aria-hidden="true" /> Combine back into one topic
					</Button>
				</div>
			)}

			<Block
				title="People"
				action={
					<Popover open={isAdding} onOpenChange={setIsAdding}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="link"
								size="sm"
								className="h-auto p-0 text-xs"
								disabled={isBusy}
							>
								<Plus aria-hidden="true" /> Add person
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							sideOffset={8}
							collisionPadding={16}
							className={peoplePickerContentClassName}
						>
							<TopicPeoplePicker
								actions={actions}
								contacts={contacts}
								taken={
									new Set([
										...suggested.map((person) => person.id),
										...added.map((person) => person.id),
									])
								}
								disabled={isBusy}
								onAdd={(person) =>
									onRestorePeople(entry.key, [person])
								}
							/>
						</PopoverContent>
					</Popover>
				}
			>
				{suggested.length + added.length ? (
					<div className="flex flex-wrap gap-1.5">
						{suggested.map((person) => (
							<PersonChip
								key={person.id}
								name={person.name}
								removed={person.removed}
								disabled={isBusy}
								onToggle={() =>
									person.removed
										? onRestorePeople(entry.key, [person])
										: onRemovePeople(entry.key, [person.id])
								}
							/>
						))}
						{added.map((person) => (
							<PersonChip
								key={person.id}
								name={person.name}
								removed={false}
								disabled={isBusy}
								onToggle={() =>
									onRemovePeople(entry.key, [person.id])
								}
							/>
						))}
					</div>
				) : (
					<P className="text-muted-foreground text-sm">
						No regular people yet.
					</P>
				)}
			</Block>

			<TopicConversationsPanel
				actions={actions}
				review={review}
				topicKey={entry.key}
				others={others}
				isBusy={isBusy}
				changes={changes}
				onSave={onSave}
			/>

			{value.keep && (evidence?.folderIds.length ?? 0) > 0 && (
				<FormCheckbox
					name={`topics.${index}.fileFromFolder`}
					label={
						<span className="text-muted-foreground text-xs">
							File new mail from {evidence?.folders.join(", ")}{" "}
							here
						</span>
					}
					disabled={isBusy}
				/>
			)}
			<P className="sr-only">
				{topicSummary(evidence, value, addedNames)}
			</P>
		</section>
	);
}

function Block({
	title,
	action,
	children,
}: {
	title: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<P className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
					{title}
				</P>
				{action}
			</div>
			{children}
		</div>
	);
}

function PersonChip({
	name,
	removed,
	disabled,
	onToggle,
}: {
	name: string;
	removed: boolean;
	disabled: boolean;
	onToggle: () => void;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-sm",
				removed && "text-muted-foreground line-through",
			)}
		>
			{givenFirst(name)}
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="size-5"
				disabled={disabled}
				aria-label={removed ? `Put ${name} back` : `Take ${name} off`}
				onClick={onToggle}
			>
				{removed ? (
					<Undo2 className="size-3" aria-hidden="true" />
				) : (
					<X className="size-3" aria-hidden="true" />
				)}
			</Button>
		</span>
	);
}
