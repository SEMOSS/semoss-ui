import { useId, useState } from "react";
import { Link, useParams } from "react-router";
import {
	Button,
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
import { isFollowed } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { memoriesAbout } from "../state/memory";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { MemoryList } from "./memory-list";
import { PersonAvatar } from "./person-avatar";
import { Section } from "./section";
import { TextEntryForm } from "./text-entry-form";
import { ThreadMenu } from "./thread-menu";
import { TopicChip } from "./topic-chip";

/** Contact settings apply consistently to topic memberships and future context. */
export function PersonDetail() {
	const { personId } = useParams();
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [topicToAdd, setTopicToAdd] = useState("");
	const person = state.people.find((candidate) => candidate.id === personId);
	if (!person)
		return (
			<CollaborationSurface
				header={<CollaborationPageHeader title="Person" />}
			>
				<P className="p-6 text-muted-foreground">
					Person not found in this session.
				</P>
			</CollaborationSurface>
		);
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
	const memories = memoriesAbout(state.memories, {
		type: "person",
		id: person.id,
	});
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title={
						<span className="flex min-w-0 items-center gap-3">
							<PersonAvatar
								name={person.name}
								initials={person.initials}
							/>
							<span className="min-w-0 break-words">
								{person.name}
							</span>
						</span>
					}
					description={
						<>
							{person.title}
							{person.title ? " · " : ""}
							{state.accounts.find(
								(account) => account.id === person.accountId,
							)?.name || "No account"}
						</>
					}
				>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground text-sm">
						<span className="min-w-0 break-words">
							{person.email || "Email unavailable"}
						</span>
						<span>
							Last contact {dateLabel(person.lastContact)}
						</span>
					</div>
				</CollaborationPageHeader>
			}
			asideTitle="Person context"
			aside={
				<>
					<Section title="How you work together" variant="card">
						<div className="grid grid-cols-2 gap-2">
							{[
								["Threads", threads.length],
								["Topics", topics.length],
							].map(([label, count]) => (
								<div
									key={label}
									className="rounded-lg bg-muted/60 px-3 py-2"
								>
									<P className="font-medium text-lg tabular-nums">
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
						variant="card"
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
						<Label htmlFor={`${fieldId}-person-follow`}>
							Follow
						</Label>
						<Switch
							id={`${fieldId}-person-follow`}
							checked={isFollowed(person)}
							disabled={person.vip}
							onCheckedChange={(on) =>
								dispatch({
									type: "person.save",
									personId: person.id,
									changes: {
										follow: on ? "following" : "declined",
									},
								})
							}
						/>
					</div>
					<div className="flex items-center justify-between gap-4 py-1">
						<Label htmlFor={`${fieldId}-person-vip`}>VIP</Label>
						<Switch
							id={`${fieldId}-person-vip`}
							checked={person.vip}
							onCheckedChange={(vip) =>
								dispatch({
									type: "person.save",
									personId: person.id,
									changes: vip
										? { vip, follow: "following" }
										: { vip },
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
						This preference does not delete provider messages or
						existing conversations.
					</Small>
					{person.neverIngest && memories.length > 0 && (
						<div className="space-y-2 rounded-lg border border-border p-3">
							<Small className="block font-normal text-sm leading-6">
								The assistant no longer sees the{" "}
								{memories.length === 1
									? "memory"
									: `${memories.length} memories`}{" "}
								about {person.name}.
							</Small>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									for (const memory of memories)
										dispatch({
											type: "memory.delete",
											memoryId: memory.id,
										});
								}}
							>
								Delete {memories.length === 1 ? "it" : "them"}
							</Button>
						</div>
					)}
				</Section>
				<Section
					title="What the assistant remembers"
					className="space-y-3 border-b px-4 py-4 md:px-6"
				>
					<MemoryList
						memories={memories}
						emptyText={`Facts about ${person.name} that the assistant keeps across threads.`}
						addLabel={`New memory about ${person.name}`}
						about={{ type: "person", id: person.id }}
						isSample={person.isSample}
					/>
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
							<ThreadMenu key={thread.id} thread={thread}>
								{(menu) => (
									<div className="flex items-center justify-between gap-3 border-b pb-3 last:border-0">
										<div className="min-w-0 flex-1">
											<Link
												className="break-words font-medium text-sm hover:underline"
												to={`/brain/threads/${encodeURIComponent(thread.id)}`}
											>
												{thread.subject}
											</Link>
											<Small className="mt-1 font-normal text-muted-foreground text-xs">
												{thread.channel} ·{" "}
												{participant?.role}
												{participant?.included &&
												!person.neverIngest
													? ""
													: " · Excluded"}
											</Small>
										</div>
										<Switch
											checked={
												Boolean(
													participant?.included,
												) && !person.neverIngest
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
										{menu}
									</div>
								)}
							</ThreadMenu>
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
