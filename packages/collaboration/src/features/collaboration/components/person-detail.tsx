import { useId, useState } from "react";
import { Link, useParams } from "react-router";
import {
	Badge,
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
	return (
		<CollaborationSurface>
			<div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
				<header className="space-y-3">
					<Button asChild variant="ghost" size="sm">
						<Link to="/brain/people">Back to people</Link>
					</Button>
					<div className="flex items-center gap-3">
						<PersonAvatar
							name={person.name}
							initials={person.initials}
						/>
						<H1 className="font-semibold text-xl">{person.name}</H1>
						<Badge variant="outline">
							{person.isSample ? "Sample" : "Connected"}
						</Badge>
					</div>
					<P className="break-words text-muted-foreground">
						{person.email || "Email unavailable"}
						{person.title ? ` · ${person.title}` : ""}
					</P>
					<Small className="text-muted-foreground">
						Last contact {dateLabel(person.lastContact)}
					</Small>
				</header>
				<Section title="Relationship">
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
					<div className="flex items-center justify-between gap-4">
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
					<div className="flex items-center justify-between gap-4">
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
					<Small className="text-muted-foreground">
						This session preference does not delete provider
						messages or existing conversations.
					</Small>
				</Section>
				<Section title="Topics">
					<div className="flex flex-wrap gap-2">
						{topics.map((topic) => (
							<div
								key={topic.id}
								className="flex items-center gap-1"
							>
								<TopicChip topic={topic} />
								<Button
									variant="ghost"
									size="sm"
									aria-label={`Remove ${person.name} from ${topic.short}`}
									onClick={() =>
										dispatch({
											type: "topic.person",
											topicId: topic.id,
											personId: person.id,
											state: "removed",
										})
									}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
					{available.length > 0 && (
						<div className="space-y-2">
							<Label htmlFor={`${fieldId}-person-add-topic`}>
								Add topic
							</Label>
							<Select
								value={topicToAdd}
								onValueChange={setTopicToAdd}
							>
								<SelectTrigger
									id={`${fieldId}-person-add-topic`}
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
				<Section title={`Threads with ${person.name}`}>
					{threads.map((thread) => {
						const participant = thread.participants.find(
							(candidate) => candidate.personId === person.id,
						);
						return (
							<div
								key={thread.id}
								className="flex items-center justify-between gap-3 border-b pb-3"
							>
								<Link
									className="break-words hover:underline"
									to={`/brain/threads/${encodeURIComponent(thread.id)}`}
								>
									{thread.subject}
								</Link>
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
				</Section>
			</div>
		</CollaborationSurface>
	);
}
