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
import { dateLabel } from "../date-label";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { PersonAvatar } from "./person-avatar";
import { Section } from "./section";
import { TextEntryForm } from "./text-entry-form";
import { TopicActions } from "./topic-actions";
import { TopicChip } from "./topic-chip";
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
	const members = topic.people.filter((person) => person.state === "member");
	const workItems = state.items.filter(
		(item) =>
			(item.status === "open" || item.status === "waiting") &&
			threads.some(
				(thread) => thread.id === item.threadId && !thread.muted,
			),
	);
	return (
		<CollaborationSurface
			aside={
				<>
					<Section
						title="In Work now"
						variant="widget"
						action={
							<Link
								className="inline-flex min-h-6 items-center text-primary text-xs hover:underline"
								to={`/work/topic/${encodeURIComponent(topic.id)}`}
							>
								Open feed
							</Link>
						}
					>
						{workItems.slice(0, 5).map((item) => (
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
									{item.status === "waiting"
										? "Waiting on others"
										: "For you"}
									{item.due
										? ` · due ${dateLabel(item.due)}`
										: ""}
								</Small>
							</div>
						))}
						{!workItems.length && (
							<Small className="font-normal text-muted-foreground text-xs">
								Nothing open for this topic.
							</Small>
						)}
					</Section>
					<Section title="People in this topic" variant="widget">
						{members.slice(0, 4).map((member) => {
							const person = state.people.find(
								(candidate) => candidate.id === member.personId,
							);
							return (
								person && (
									<div
										key={person.id}
										className="flex items-center gap-3"
									>
										<PersonAvatar
											name={person.name}
											initials={person.initials}
										/>
										<div className="min-w-0">
											<Link
												className="break-words font-medium text-sm hover:underline"
												to={`/brain/people/${encodeURIComponent(person.id)}`}
											>
												{person.name}
											</Link>
											<Small className="font-normal text-muted-foreground text-xs">
												{member.role}
											</Small>
										</div>
									</div>
								)
							);
						})}
						{!members.length && (
							<Small className="font-normal text-muted-foreground text-xs">
								No confirmed members yet.
							</Small>
						)}
					</Section>
					<Section title="Topic context" variant="widget">
						<P className="text-muted-foreground text-xs leading-5">
							Confirmed goals and notes are available to the
							assistant when this topic is confirmed on a thread.
						</P>
					</Section>
				</>
			}
			asideTitle="Topic context"
		>
			<header className="space-y-3 px-4 pt-5 pb-4 md:px-6">
				<div
					className="h-1 w-11 rounded-full bg-primary"
					aria-hidden="true"
				/>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<H1 className="font-semibold text-xl">{topic.name}</H1>
					<div className="flex items-center gap-2">
						<Button
							ref={editButtonRef}
							variant="outline"
							size="sm"
							onClick={() => setIsEditing(true)}
						>
							Edit topic
						</Button>
						<TopicActions
							topic={topic}
							threadCount={threads.length}
						/>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Small className="font-normal text-muted-foreground text-xs">
						{state.accounts.find(
							(account) => account.id === topic.accountId,
						)?.name || "No account"}{" "}
						· {topic.kind} · {threads.length} threads ·{" "}
						{members.length} people
					</Small>
					<TopicChip topic={topic} />
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
						<SelectTrigger
							id={`${fieldId}-topic-status`}
							className="h-8 w-auto text-xs"
						>
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
				<P className="text-muted-foreground text-sm leading-6">
					{topic.description ||
						"Add a description to explain this topic."}
				</P>
			</header>
			<Tabs defaultValue="threads" key={topic.id} className="gap-0">
				<div className="overflow-x-auto border-b px-4 md:px-6">
					<TabsList className={collaborationTabsStyles.list}>
						<TabsTrigger
							value="threads"
							className={collaborationTabsStyles.trigger}
						>
							Threads
						</TabsTrigger>
						<TabsTrigger
							value="people"
							className={collaborationTabsStyles.trigger}
						>
							People
						</TabsTrigger>
						<TabsTrigger
							value="notes"
							className={collaborationTabsStyles.trigger}
						>
							Goals and notes
						</TabsTrigger>
						<TabsTrigger
							value="signals"
							className={collaborationTabsStyles.trigger}
						>
							Signals
						</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="threads" className="mt-0">
					{threads.map((thread) => (
						<div
							key={thread.id}
							className="flex flex-wrap items-center gap-3 border-b px-4 py-3 hover:bg-muted/30 md:px-6"
						>
							<Badge variant="outline">{thread.channel}</Badge>
							<div className="min-w-0 flex-1">
								<Link
									className="break-words font-medium text-sm hover:underline"
									to={`/brain/threads/${encodeURIComponent(thread.id)}`}
								>
									{thread.subject}
								</Link>
								<Small className="mt-0.5 font-normal text-muted-foreground text-xs">
									{dateLabel(thread.lastAt)} ·{" "}
									{thread.messageCount} messages
									{thread.topicLinks.some(
										(link) =>
											link.topicId === topic.id &&
											link.primary,
									)
										? " · main topic"
										: ""}
								</Small>
							</div>
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
				<TabsContent value="people" className="mt-0">
					<div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 md:px-6">
						<Label
							htmlFor={`${fieldId}-topic-person`}
							className="sr-only"
						>
							Add someone
						</Label>
						<Select
							value={personToAdd}
							onValueChange={setPersonToAdd}
						>
							<SelectTrigger
								id={`${fieldId}-topic-person`}
								className="h-9 w-full sm:w-auto"
							>
								<SelectValue placeholder="Add someone to this topic" />
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
							size="sm"
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
								className="space-y-3 border-b px-4 py-4 md:px-6"
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
													className="flex items-center gap-3 py-1"
												>
													<PersonAvatar
														name={person.name}
														initials={
															person.initials
														}
													/>
													<div className="min-w-0 flex-1">
														<Link
															className="break-words font-medium text-sm hover:underline"
															to={`/brain/people/${encodeURIComponent(person.id)}`}
														>
															{person.name}
														</Link>
														<Small className="mt-0.5 font-normal text-muted-foreground text-xs leading-5">
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
					<P className="px-4 py-4 text-muted-foreground text-xs leading-5 md:px-6">
						Membership is separate from including a person's
						messages in assistant context.
					</P>
				</TabsContent>
				<TabsContent value="notes" className="mt-0">
					<Section
						title="Goals"
						className="space-y-3 border-b px-4 py-4 md:px-6"
						action={
							<Small className="font-normal text-muted-foreground text-xs">
								{
									topic.goals.filter(
										(goal) => goal.status !== "done",
									).length
								}{" "}
								open
							</Small>
						}
					>
						{topic.goals.map((goal) => (
							<div
								key={goal.noteId}
								className="flex items-start gap-3 py-1"
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
					<Section
						title="Notes for the assistant"
						className="space-y-3 border-b px-4 py-4 md:px-6"
					>
						{topic.notes.map((note) => (
							<div
								key={note.noteId}
								className="space-y-2 border-b pb-3"
							>
								<P className="text-sm leading-6">{note.text}</P>
								<Small className="font-normal text-muted-foreground text-xs">
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
				<TabsContent value="signals" className="mt-0">
					<Section
						title="Keywords"
						className="space-y-3 border-b px-4 py-4 md:px-6"
					>
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
						<Small className="font-normal text-muted-foreground text-xs leading-5">
							Signals are stored in this session. Automatic
							classification is not connected.
						</Small>
					</Section>
					<Section
						title="Calendar series"
						className="space-y-3 border-b px-4 py-4 md:px-6"
					>
						{topic.calendarSeries.length ? (
							topic.calendarSeries.map((series) => (
								<P key={series} className="text-sm">
									{series}
								</P>
							))
						) : (
							<P className="text-muted-foreground text-sm">
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
