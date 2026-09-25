import { Star, X } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router";
import {
	Button,
	cn,
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
import type { Thread } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";
import { Section } from "./section";
import { TopicChip } from "./topic-chip";

/** Shared thread classification and inclusion controls in Brain and Work. */
export function ThreadSettings({
	thread,
	presentation = "plain",
	sections = ["topics", "people", "visibility"],
}: {
	thread: Thread;
	presentation?: "plain" | "widgets";
	sections?: readonly ("topics" | "people" | "visibility")[];
}) {
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [topicToAdd, setTopicToAdd] = useState("");
	const available = state.topics.filter(
		(topic) =>
			topic.isSample === thread.isSample &&
			topic.status !== "suggested" &&
			!thread.topicLinks.some((link) => link.topicId === topic.id),
	);
	return (
		<div className={presentation === "widgets" ? "space-y-3" : "space-y-6"}>
			{sections.includes("topics") && (
				<Section
					title="Topics"
					variant={presentation === "widgets" ? "widget" : "plain"}
				>
					{thread.topicLinks.map((link) => {
						const topic = state.topics.find(
							(candidate) => candidate.id === link.topicId,
						);
						return (
							topic && (
								<div
									key={topic.id}
									className="flex flex-wrap items-center gap-1"
								>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={
											link.primary
												? `${topic.short} is the main topic`
												: `Make ${topic.short} the main topic`
										}
										aria-pressed={link.primary}
										onClick={() =>
											dispatch({
												type: "thread.link",
												threadId: thread.id,
												topicId: topic.id,
												operation: "primary",
											})
										}
									>
										<Star
											className={
												link.primary
													? "fill-primary text-primary"
													: "text-muted-foreground"
											}
											aria-hidden="true"
										/>
									</Button>
									<TopicChip
										topic={topic}
										suggested={link.source === "suggested"}
									/>
									{link.source === "suggested" && (
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												dispatch({
													type: "thread.link",
													threadId: thread.id,
													topicId: topic.id,
													operation: "confirm",
												})
											}
										>
											Confirm
										</Button>
									)}
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={`Remove ${topic.short}`}
										onClick={() =>
											dispatch({
												type: "thread.link",
												threadId: thread.id,
												topicId: topic.id,
												operation: "remove",
											})
										}
									>
										<X aria-hidden="true" />
									</Button>
								</div>
							)
						);
					})}
					{!thread.topicLinks.length && (
						<P className="text-muted-foreground">No topic yet.</P>
					)}
					{available.length > 0 && (
						<div className="space-y-2">
							<Label htmlFor={`${fieldId}-add-topic`}>
								Add a topic
							</Label>
							<Select
								value={topicToAdd}
								onValueChange={setTopicToAdd}
							>
								<SelectTrigger
									id={`${fieldId}-add-topic`}
									className="w-full"
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
										type: "thread.link",
										threadId: thread.id,
										topicId: topicToAdd,
										operation: "add",
									});
									setTopicToAdd("");
								}}
							>
								Add topic
							</Button>
						</div>
					)}
				</Section>
			)}
			{sections.includes("people") && (
				<Section
					title="People"
					variant={presentation === "widgets" ? "widget" : "plain"}
				>
					{thread.participants
						.filter(
							(participant) =>
								participant.personId !== "me" &&
								participant.personId !== "live-me",
						)
						.map((participant) => {
							const person = state.people.find(
								(candidate) =>
									candidate.id === participant.personId,
							);
							return (
								<div
									key={participant.personId}
									className="flex items-center gap-2 py-1"
								>
									<PersonAvatar
										name={
											person?.name ||
											"Unknown participant"
										}
									/>
									<div className="min-w-0 flex-1">
										<Link
											className={cn(
												"break-words font-medium text-sm hover:text-primary hover:underline",
												(!participant.included ||
													person?.neverIngest) &&
													"text-muted-foreground",
											)}
											to={`/brain/people/${encodeURIComponent(participant.personId)}`}
										>
											{person?.name ||
												"Unknown participant"}
										</Link>
										<Small className="mt-1 text-muted-foreground text-xs leading-relaxed">
											{participant.included &&
											!person?.neverIngest
												? participant.role
												: "Excluded from future context"}
										</Small>
									</div>
									<Switch
										checked={
											participant.included &&
											!person?.neverIngest
										}
										disabled={person?.neverIngest}
										aria-label={`Include ${person?.name || "participant"} in assistant context`}
										onCheckedChange={(included) =>
											dispatch({
												type: "thread.participant",
												threadId: thread.id,
												personId: participant.personId,
												included,
											})
										}
									/>
								</div>
							);
						})}
					<Small className="text-muted-foreground text-xs leading-relaxed">
						Inclusion controls the source text selected for future
						questions and remains subject to Sources and rules.
						Stored conversations and quoted text in other messages
						are not deleted.
					</Small>
				</Section>
			)}
			{sections.includes("visibility") && (
				<Section
					title="Work visibility"
					variant={presentation === "widgets" ? "widget" : "plain"}
				>
					<div className="flex items-center justify-between gap-3">
						<Label htmlFor={`${fieldId}-mute`}>
							Mute this thread
						</Label>
						<Switch
							id={`${fieldId}-mute`}
							checked={thread.muted}
							onCheckedChange={(muted) =>
								dispatch({
									type: "thread.mute",
									threadId: thread.id,
									muted,
								})
							}
						/>
					</div>
					<Small className="text-muted-foreground">
						Muted threads remain in Brain and are hidden from the
						Work feed.
					</Small>
				</Section>
			)}
		</div>
	);
}
