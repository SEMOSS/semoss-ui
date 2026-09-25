import { useId, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
	Badge,
	Button,
	Checkbox,
	H1,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { PersonAvatar } from "./person-avatar";
import { Section } from "./section";
import { TextEntryForm } from "./text-entry-form";
import { TopicEditor } from "./topic-editor";

/** Topic threads, people, notes, and signals share one coherent local record. */
export function TopicDetail() {
	const { topicId } = useParams();
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [isEditing, setIsEditing] = useState(false);
	const editButtonRef = useRef<HTMLButtonElement>(null);
	const [personToAdd, setPersonToAdd] = useState("");
	const topic = state.topics.find((candidate) => candidate.id === topicId);
	if (!topic) return <P className="p-6">Topic not found in this session.</P>;
	const threads = state.threads.filter((thread) =>
		thread.topicLinks.some((link) => link.topicId === topic.id),
	);
	const availablePeople = state.people.filter(
		(person) =>
			person.isSample === topic.isSample &&
			!topic.people.some(
				(member) =>
					member.personId === person.id && member.state === "member",
			),
	);
	return (
		<CollaborationSurface
			aside={
				<>
					<Section title="Topic context">
						<P className="text-muted-foreground">
							Confirmed goals and notes are available to the
							assistant when this topic is confirmed on a thread.
						</P>
						<Badge variant="outline">
							{topic.isSample ? "Sample topic" : "Session topic"}
						</Badge>
					</Section>
					<Button asChild variant="outline">
						<Link
							to={`/work/topic/${encodeURIComponent(topic.id)}`}
						>
							View work for this topic
						</Link>
					</Button>
				</>
			}
			asideTitle="Topic context"
		>
			<header className="space-y-3 border-b p-4 md:p-6">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<H1 className="font-semibold text-xl">{topic.name}</H1>
					<Button
						ref={editButtonRef}
						variant="outline"
						size="sm"
						onClick={() => setIsEditing(true)}
					>
						Edit topic
					</Button>
				</div>
				<P className="text-muted-foreground">
					{topic.description ||
						"Add a description to explain this topic."}
				</P>
				<div className="flex flex-wrap items-center gap-3">
					<Small className="text-muted-foreground">
						{state.accounts.find(
							(account) => account.id === topic.accountId,
						)?.name || "No account"}{" "}
						· {topic.kind} · {threads.length} threads
					</Small>
					<Label
						htmlFor={`${fieldId}-topic-status`}
						className="sr-only"
					>
						Topic status
					</Label>
					<Select
						value={topic.status}
						onValueChange={(status) => {
							if (
								status === "active" ||
								status === "dormant" ||
								status === "archived"
							)
								dispatch({
									type: "topic.save",
									topic: { id: topic.id, status },
								});
						}}
					>
						<SelectTrigger id={`${fieldId}-topic-status`}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="dormant">Dormant</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
							{topic.status === "suggested" && (
								<SelectItem value="suggested">
									Suggested
								</SelectItem>
							)}
						</SelectContent>
					</Select>
				</div>
			</header>
			<Tabs defaultValue="threads" key={topic.id}>
				<div className="overflow-x-auto border-b px-4 py-3 md:px-6">
					<TabsList>
						<TabsTrigger value="threads">Threads</TabsTrigger>
						<TabsTrigger value="people">People</TabsTrigger>
						<TabsTrigger value="notes">Goals and notes</TabsTrigger>
						<TabsTrigger value="signals">Signals</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="threads" className="mt-0">
					{threads.map((thread) => (
						<div
							key={thread.id}
							className="flex flex-wrap items-center gap-3 border-b p-4 md:px-6"
						>
							<Badge variant="outline">{thread.channel}</Badge>
							<Link
								className="min-w-0 flex-1 break-words font-medium hover:underline"
								to={`/brain/threads/${encodeURIComponent(thread.id)}`}
							>
								{thread.subject}
							</Link>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									dispatch({
										type: "thread.link",
										threadId: thread.id,
										topicId: topic.id,
										operation: "remove",
									})
								}
							>
								Remove from topic
							</Button>
						</div>
					))}
					{!threads.length && (
						<P className="p-6 text-muted-foreground">
							No threads in this topic yet. Add it from a thread's
							details.
						</P>
					)}
				</TabsContent>
				<TabsContent value="people" className="space-y-6 p-4 md:p-6">
					<div className="space-y-2">
						<Label htmlFor={`${fieldId}-topic-person`}>
							Add someone
						</Label>
						<Select
							value={personToAdd}
							onValueChange={setPersonToAdd}
						>
							<SelectTrigger
								id={`${fieldId}-topic-person`}
								className="w-full"
							>
								<SelectValue placeholder="Choose a person" />
							</SelectTrigger>
							<SelectContent>
								{availablePeople.map((person) => (
									<SelectItem
										key={person.id}
										value={person.id}
									>
										{person.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							variant="outline"
							disabled={
								!availablePeople.some(
									(person) => person.id === personToAdd,
								)
							}
							onClick={() => {
								dispatch({
									type: "topic.person",
									topicId: topic.id,
									personId: personToAdd,
									state: "member",
								});
								setPersonToAdd("");
							}}
						>
							Add person
						</Button>
					</div>
					{(["member", "suggested", "removed"] as const).map(
						(membership) => (
							<Section
								key={membership}
								title={
									membership === "member"
										? "In this topic"
										: membership === "suggested"
											? "Suggested"
											: "Removed"
								}
							>
								{topic.people
									.filter(
										(person) => person.state === membership,
									)
									.map((member) => {
										const person = state.people.find(
											(candidate) =>
												candidate.id ===
												member.personId,
										);
										return (
											person && (
												<div
													key={person.id}
													className="flex items-center gap-3"
												>
													<PersonAvatar
														name={person.name}
														initials={
															person.initials
														}
													/>
													<div className="min-w-0 flex-1">
														<Link
															className="font-medium hover:underline"
															to={`/brain/people/${encodeURIComponent(person.id)}`}
														>
															{person.name}
														</Link>
														<Small className="text-muted-foreground">
															{member.role}
															{member.reason
																? ` · ${member.reason}`
																: ""}
														</Small>
													</div>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															dispatch({
																type: "topic.person",
																topicId:
																	topic.id,
																personId:
																	person.id,
																state:
																	membership ===
																	"member"
																		? "removed"
																		: "member",
															})
														}
													>
														{membership === "member"
															? "Remove"
															: membership ===
																	"suggested"
																? "Add"
																: "Restore"}
													</Button>
												</div>
											)
										);
									})}
							</Section>
						),
					)}
					<P className="text-muted-foreground">
						Membership is separate from including a person's
						messages in assistant context.
					</P>
				</TabsContent>
				<TabsContent value="notes" className="space-y-6 p-4 md:p-6">
					<Section title="Goals">
						{topic.goals.map((goal) => (
							<div
								key={goal.noteId}
								className="flex items-start gap-3"
							>
								<Checkbox
									id={`${fieldId}-${goal.noteId}`}
									checked={goal.status === "done"}
									onCheckedChange={(checked) =>
										dispatch({
											type: "topic.note",
											topicId: topic.id,
											kind: "goal",
											operation: "save",
											noteId: goal.noteId,
											status:
												checked === true
													? "done"
													: "open",
										})
									}
								/>
								<Label
									htmlFor={`${fieldId}-${goal.noteId}`}
									className={
										goal.status === "done"
											? "font-normal text-muted-foreground line-through"
											: "font-normal"
									}
								>
									{goal.text}
								</Label>
							</div>
						))}
						<TextEntryForm
							label="New goal"
							onSave={(text) =>
								dispatch({
									type: "topic.note",
									topicId: topic.id,
									kind: "goal",
									operation: "save",
									text,
									status: "open",
								})
							}
						/>
					</Section>
					<Section title="Notes for the assistant">
						{topic.notes.map((note) => (
							<div
								key={note.noteId}
								className="space-y-2 border-b pb-4"
							>
								<P>{note.text}</P>
								<Small className="text-muted-foreground">
									{note.by} · {note.status}
									{note.source ? ` · ${note.source}` : ""}
								</Small>
								<div className="flex gap-2">
									{note.status === "draft" && (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												dispatch({
													type: "topic.note",
													topicId: topic.id,
													kind: "note",
													operation: "save",
													noteId: note.noteId,
													status: "confirmed",
												})
											}
										>
											Confirm
										</Button>
									)}
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											dispatch({
												type: "topic.note",
												topicId: topic.id,
												kind: "note",
												operation: "remove",
												noteId: note.noteId,
											})
										}
									>
										Remove
									</Button>
								</div>
							</div>
						))}
						<TextEntryForm
							label="New note"
							multiline
							onSave={(text) =>
								dispatch({
									type: "topic.note",
									topicId: topic.id,
									kind: "note",
									operation: "save",
									text,
									status: "confirmed",
								})
							}
						/>
					</Section>
				</TabsContent>
				<TabsContent value="signals" className="space-y-6 p-4 md:p-6">
					<Section title="Keywords">
						<div className="flex flex-wrap gap-2">
							{topic.keywords.map((word) => (
								<Button
									key={word}
									variant="outline"
									size="sm"
									aria-label={`Remove keyword ${word}`}
									onClick={() =>
										dispatch({
											type: "topic.save",
											topic: {
												id: topic.id,
												keywords: topic.keywords.filter(
													(item) => item !== word,
												),
											},
										})
									}
								>
									{word} ×
								</Button>
							))}
						</div>
						<TextEntryForm
							label="Add keyword"
							onSave={(text) =>
								dispatch({
									type: "topic.save",
									topic: {
										id: topic.id,
										keywords: [
											...new Set([
												...topic.keywords,
												text,
											]),
										],
									},
								})
							}
						/>
						<Small className="text-muted-foreground">
							Signals are stored in this session. Automatic
							classification is not connected.
						</Small>
					</Section>
					<Section title="Calendar series">
						{topic.calendarSeries.length ? (
							topic.calendarSeries.map((series) => (
								<P key={series}>{series}</P>
							))
						) : (
							<P className="text-muted-foreground">
								No linked series.
							</P>
						)}
					</Section>
				</TabsContent>
			</Tabs>
			{isEditing && (
				<TopicEditor
					returnFocusRef={editButtonRef}
					topic={topic}
					onClose={() => setIsEditing(false)}
				/>
			)}
		</CollaborationSurface>
	);
}
