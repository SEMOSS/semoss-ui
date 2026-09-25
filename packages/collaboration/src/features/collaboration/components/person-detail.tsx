import { useId, useState } from "react";
import { Link, useParams } from "react-router";
import {
	Button,
	H1,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Switch,
} from "@semoss/ui/next";
import { dateLabel } from "../date-label";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { PersonAvatar } from "./person-avatar";
import { Section } from "./section";
import { TextEntryForm } from "./text-entry-form";
import { TopicChip } from "./topic-chip";

/** Contact settings apply consistently to topic memberships and future context. */
export function PersonDetail() {
	const { personId } = useParams();
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [topicToAdd, setTopicToAdd] = useState("");
	const person = state.people.find((candidate) => candidate.id === personId);
	if (!person)
		return <P className="p-6">Person not found in this session.</P>;
	const topics = state.topics.filter((topic) =>
		topic.people.some(
			(member) =>
				member.personId === person.id && member.state === "member",
		),
	);
	const available = state.topics.filter(
		(topic) =>
			topic.isSample === person.isSample &&
			!topics.some((member) => member.id === topic.id),
	);
	const threads = state.threads.filter((thread) =>
		thread.participants.some(
			(participant) => participant.personId === person.id,
		),
	);
	const openItems = state.items.filter(
		(item) =>
			item.actorId === person.id &&
			(item.status === "open" || item.status === "waiting") &&
			!state.threads.find((thread) => thread.id === item.threadId)?.muted,
	);
	return (
		<CollaborationSurface
			asideTitle="Person context"
			aside={
				<>
					<Section title="How you work together" variant="widget">
						<div className="grid grid-cols-2 gap-2">
							{[
								["Threads", threads.length],
								["Topics", topics.length],
							].map(([label, count]) => (
								<div
									key={label}
									className="rounded-lg bg-muted/60 px-3 py-2"
								>
									<P className="font-semibold text-lg tabular-nums">
										{count}
									</P>
									<Small className="font-normal text-muted-foreground text-xs">
										{label}
									</Small>
								</div>
							))}
						</div>
						<Small className="font-normal text-muted-foreground text-xs leading-5">
							Topics and threads linked to this person.
						</Small>
					</Section>
					<Section
						title={`Open with ${person.name.split(" ")[0]}`}
						variant="widget"
					>
						{openItems.map((item) => (
							<div
								key={item.id}
								className="space-y-1 border-b pb-3 last:border-0 last:pb-0"
							>
								<Link
									className="break-words text-sm hover:underline"
									to={`/work/thread/${encodeURIComponent(item.threadId)}`}
								>
									{item.title}
								</Link>
								<Small className="font-normal text-muted-foreground text-xs">
									{item.due
										? `Due ${dateLabel(item.due)}`
										: dateLabel(item.received)}
								</Small>
							</div>
						))}
						{!openItems.length && (
							<Small className="font-normal text-muted-foreground text-xs">
								Nothing open with this person.
							</Small>
						)}
					</Section>
				</>
			}
		>
			<div>
				<header className="space-y-3 border-b px-4 py-5 md:px-6">
					<div className="flex items-start gap-3">
						<PersonAvatar
							name={person.name}
							initials={person.initials}
						/>
						<div className="min-w-0 flex-1 space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<H1 className="break-words font-semibold text-xl">
									{person.name}
								</H1>
							</div>
							<P className="break-words text-muted-foreground text-xs leading-5">
								{person.title}
								{person.title ? " · " : ""}
								{state.accounts.find(
									(account) =>
										account.id === person.accountId,
								)?.name || "No account"}
							</P>
							<P className="break-words text-muted-foreground text-xs leading-5">
								{person.email || "Email unavailable"}
							</P>
							<Small className="font-normal text-muted-foreground text-xs">
								Last contact {dateLabel(person.lastContact)}
							</Small>
						</div>
					</div>
				</header>
				<Section
					title="Relationship"
					className="space-y-3 border-b px-4 py-4 md:px-6"
				>
					<TextEntryForm
						key={person.id}
						label="Relationship"
						initialValue={person.relationship}
						submitLabel="Save relationship"
						onSave={(relationship) =>
							dispatch({
								type: "person.save",
								personId: person.id,
								changes: { relationship },
							})
						}
					/>
					<div className="flex items-center justify-between gap-4 py-1">
						<Label htmlFor={`${fieldId}-person-vip`}>VIP</Label>
						<Switch
							id={`${fieldId}-person-vip`}
							checked={person.vip}
							onCheckedChange={(vip) =>
								dispatch({
									type: "person.save",
									personId: person.id,
									changes: { vip },
								})
							}
						/>
					</div>
					<div className="flex items-center justify-between gap-4 py-1">
						<Label htmlFor={`${fieldId}-person-excluded`}>
							Exclude from future assistant context
						</Label>
						<Switch
							id={`${fieldId}-person-excluded`}
							checked={person.neverIngest}
							onCheckedChange={(neverIngest) =>
								dispatch({
									type: "person.save",
									personId: person.id,
									changes: { neverIngest },
								})
							}
						/>
					</div>
					<Small className="font-normal text-muted-foreground text-xs leading-5">
						This session preference does not delete provider
						messages or existing conversations.
					</Small>
				</Section>
				<Section
					title="Topics"
					className="space-y-3 border-b px-4 py-4 md:px-6"
				>
					<div className="flex flex-wrap gap-2">
						{topics.map((topic) => (
							<TopicChip
								key={topic.id}
								topic={topic}
								removeLabel={`Remove ${person.name} from ${topic.short}`}
								onRemove={() =>
									dispatch({
										type: "topic.person",
										topicId: topic.id,
										personId: person.id,
										state: "removed",
									})
								}
							/>
						))}
					</div>
					{available.length > 0 && (
						<div className="flex flex-wrap items-center gap-2">
							<Label
								htmlFor={`${fieldId}-person-add-topic`}
								className="sr-only"
							>
								Add topic
							</Label>
							<Select
								value={topicToAdd}
								onValueChange={setTopicToAdd}
							>
								<SelectTrigger
									id={`${fieldId}-person-add-topic`}
									className="h-9 w-full sm:w-auto"
								>
									<SelectValue placeholder="Choose a topic" />
								</SelectTrigger>
								<SelectContent>
									{available.map((topic) => (
										<SelectItem
											key={topic.id}
											value={topic.id}
										>
											{topic.short}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								size="sm"
								disabled={
									!available.some(
										(topic) => topic.id === topicToAdd,
									)
								}
								onClick={() => {
									dispatch({
										type: "topic.person",
										topicId: topicToAdd,
										personId: person.id,
										state: "member",
									});
									setTopicToAdd("");
								}}
							>
								Add
							</Button>
						</div>
					)}
				</Section>
				<Section
					title={`Threads with ${person.name}`}
					className="space-y-3 px-4 py-4 md:px-6"
					action={
						<Small className="font-normal text-muted-foreground text-xs">
							{threads.length}
						</Small>
					}
				>
					{threads.map((thread) => {
						const participant = thread.participants.find(
							(candidate) => candidate.personId === person.id,
						);
						return (
							<div
								key={thread.id}
								className="flex items-center justify-between gap-3 border-b pb-3 last:border-0"
							>
								<div className="min-w-0 flex-1">
									<Link
										className="break-words font-medium text-sm hover:underline"
										to={`/brain/threads/${encodeURIComponent(thread.id)}`}
									>
										{thread.subject}
									</Link>
									<Small className="mt-1 font-normal text-muted-foreground text-xs">
										{thread.channel} · {participant?.role}
										{participant?.included &&
										!person.neverIngest
											? ""
											: " · Excluded"}
									</Small>
								</div>
								<Switch
									checked={
										Boolean(participant?.included) &&
										!person.neverIngest
									}
									disabled={person.neverIngest}
									aria-label={`Include ${person.name} in ${thread.subject}`}
									onCheckedChange={(included) =>
										dispatch({
											type: "thread.participant",
											threadId: thread.id,
											personId: person.id,
											included,
										})
									}
								/>
							</div>
						);
					})}
					{!threads.length && (
						<P className="text-muted-foreground text-sm">
							No threads with this person.
						</P>
					)}
				</Section>
			</div>
		</CollaborationSurface>
	);
}
