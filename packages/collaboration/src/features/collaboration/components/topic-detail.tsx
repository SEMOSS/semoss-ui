import {
	Bot,
	ChevronDown,
	LockKeyhole,
	PanelRightOpen,
	Plus,
	Search,
	X,
} from "lucide-react";
import { lazy, Suspense, useId, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
	Badge,
	Button,
	Card,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	H2,
	H3,
	Label,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Progress,
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
import { TopicSessions } from "@/features/dashboard/topic-sessions";
import { lexicon } from "@/lib/lexicon";
import { givenFirst } from "@/lib/person-name";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { useWorkUpdates } from "../live/work-updates.context";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { memoriesAbout } from "../state/memory";
import { topicTone } from "../topic-tone";
import { CollaborationPage } from "./collaboration-page";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { MemoryList } from "./memory-list";
import { PersonAvatar } from "./person-avatar";
import { TextEntryForm } from "./text-entry-form";
import { TopicActions } from "./topic-actions";
import { TopicEditor } from "./topic-editor";
import { TopicFolders } from "./topic-folders";
import { TopicGoalPopover } from "./topic-goal-popover";
import { TopicMatchesDialog } from "./topic-matches-dialog";
import { TopicThreadRow } from "./topic-thread-row";
import { useWorkFeed, WorkFilterMenu, WorkItemsList } from "./work-items-feed";

const LandingChatComposer = lazy(() =>
	import("@/features/daily-chat/landing-chat-composer").then((module) => ({
		default: module.LandingChatComposer,
	})),
);

// people groups in reading order, with the one action each membership allows
const MEMBERSHIPS = [
	{
		state: "member",
		title: "In this topic",
		action: "Remove",
		next: "removed",
	},
	{ state: "suggested", title: "Suggested", action: "Add", next: "member" },
	{ state: "removed", title: "Removed", action: "Restore", next: "member" },
] as const;

const cardClassName = "min-w-0 gap-0 overflow-hidden p-0 shadow-none";
// the context column is plain sections on the page, ruled apart; only the work list is boxed
const asideHeaderClassName =
	"flex min-w-0 flex-wrap items-center justify-between gap-3 pb-3";
const contextHeadingClassName = "font-display font-semibold text-base";
// suggested people past this many sit behind "Show more"
const SUGGESTED_PREVIEW = 3;
const hintClassName =
	"block font-normal text-muted-foreground text-xs leading-5";

/** One topic workspace for actions, threads, sessions, and editable context. */
export function TopicDetail() {
	const { topicId } = useParams();
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [isEditing, setIsEditing] = useState(false);
	const [tab, setTab] = useState("actions");
	const [isMatchReviewOpen, setIsMatchReviewOpen] = useState(false);
	const updates = useWorkUpdates();
	const editButtonRef = useRef<HTMLButtonElement>(null);
	// the button that opened the review, for focus on close; a click does not focus it in Safari
	const matchTriggerRef = useRef<HTMLElement | null>(null);
	const contextButtonRef = useRef<HTMLButtonElement>(null);
	const contextRef = useRef<HTMLElement>(null);
	const [personToAdd, setPersonToAdd] = useState("");
	const [showAllSuggested, setShowAllSuggested] = useState(false);
	const topic = state.topics.find((candidate) => candidate.id === topicId);
	const canStartAssistant =
		topic?.status === "active" || topic?.status === "dormant";
	const topicMemories = memoriesAbout(state.memories, {
		type: "topic",
		id: topicId ?? "",
	});
	const [isContextOpen, setIsContextOpen] = useState(
		Boolean(topic?.goals.length),
	);
	const [areNotesOpen, setAreNotesOpen] = useState(topicMemories.length > 0);
	const feed = useWorkFeed({ topicId: topicId ?? "", initialFilter: "open" });
	if (!topic)
		return (
			<CollaborationSurface
				header={<CollaborationPageHeader title="Topic unavailable" />}
			>
				<div className="flex flex-col items-start gap-4 p-6">
					<P className="text-muted-foreground">
						This topic is not available.
					</P>
					<Button asChild variant="outline">
						<Link to="/work">All topics</Link>
					</Button>
				</div>
			</CollaborationSurface>
		);
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
	const accountName =
		state.accounts.find((account) => account.id === topic.accountId)
			?.name || "No account";
	const doneGoals = topic.goals.filter((goal) => goal.status === "done");
	const feedThreadCount = new Set(workItems.map((item) => item.threadId))
		.size;
	// the server scores active and dormant topics; samples and isolated pages have no server to ask
	const canFindConversations =
		Boolean(updates) && !topic.isSample && canStartAssistant;
	// the menu returns focus to its own trigger; a button passes itself
	const openMatchReview = (trigger?: HTMLElement) => {
		matchTriggerRef.current = trigger ?? null;
		setIsMatchReviewOpen(true);
	};

	return (
		<CollaborationPage>
			<CollaborationPageHeader
				titleClassName="font-bold"
				layoutClassName="flex-col md:flex-row"
				title={
					<span className="flex min-w-0 items-center gap-3">
						<span
							aria-hidden="true"
							className={cn(
								"mt-2.5 size-3 shrink-0 self-start rounded-full",
								topicTone(topic.id),
							)}
						/>
						<span className="min-w-0 break-words">
							{topic.name}
						</span>
					</span>
				}
				description={
					topic.description ? (
						<Button
							ref={editButtonRef}
							variant="ghost"
							aria-label={`${topic.description}: Edit topic`}
							className="h-auto min-h-6 max-w-full justify-start whitespace-normal p-0 pl-6 text-left font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
							onClick={(event) => {
								editButtonRef.current = event.currentTarget;
								setIsEditing(true);
							}}
						>
							{topic.description}
						</Button>
					) : undefined
				}
				actions={
					<>
						<Button
							ref={contextButtonRef}
							variant={isContextOpen ? "secondary" : "outline"}
							className="pointer-coarse:min-h-11"
							aria-expanded={isContextOpen}
							aria-controls={`${fieldId}-context`}
							onClick={() => {
								setIsContextOpen((open) => !open);
								if (!isContextOpen) {
									requestAnimationFrame(() => {
										const context = contextRef.current;
										if (
											context &&
											context.getBoundingClientRect()
												.top >= window.innerHeight
										) {
											context.focus();
											context.scrollIntoView({
												block: "start",
											});
										}
									});
								}
							}}
						>
							<PanelRightOpen aria-hidden="true" />
							Context
						</Button>
						<TopicActions
							topic={topic}
							threadCount={threads.length}
							onFindConversations={
								canFindConversations
									? () => openMatchReview()
									: undefined
							}
						/>
					</>
				}
			>
				{(topic.isSample || topic.status !== "active") && (
					<div className="ml-6 flex flex-wrap items-center gap-2">
						{topic.status !== "active" && (
							<Badge variant="outline" className="capitalize">
								{topic.status}
							</Badge>
						)}
						{topic.isSample && (
							<Badge variant="secondary">Sample</Badge>
						)}
					</div>
				)}
			</CollaborationPageHeader>
			<section aria-label="Topic assistant" className="mb-8 space-y-3">
				<P className="text-muted-foreground text-sm">
					{canStartAssistant
						? "Ask about this topic’s goals, people, and emails."
						: "Set this topic to Active or Dormant to start a chat."}
				</P>
				{canStartAssistant && (
					<Suspense fallback={<output>Loading assistant…</output>}>
						<LandingChatComposer topicId={topic.id} />
					</Suspense>
				)}
			</section>
			<div
				className={cn(
					"grid min-w-0 grid-cols-1 items-start gap-5",
					isContextOpen && "xl:grid-cols-3",
				)}
			>
				<div
					className={cn(
						"min-w-0 space-y-5",
						isContextOpen && "xl:col-span-2",
					)}
				>
					<Card className={cardClassName}>
						<Tabs
							value={tab}
							onValueChange={setTab}
							className="gap-0"
						>
							<div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 md:px-5">
								<TabsList
									aria-label="Topic sections"
									className={collaborationTabsStyles.list}
								>
									<TabsTrigger
										value="actions"
										className={
											collaborationTabsStyles.trigger
										}
									>
										Actions
										<span className="text-muted-foreground tabular-nums">
											{feed.total(undefined)}
										</span>
									</TabsTrigger>
									<TabsTrigger
										value="threads"
										className={
											collaborationTabsStyles.trigger
										}
									>
										Threads
									</TabsTrigger>
									<TabsTrigger
										value="sessions"
										className={
											collaborationTabsStyles.trigger
										}
									>
										{lexicon.chats}
									</TabsTrigger>
								</TabsList>
								{tab === "actions" && (
									<div className="ml-auto flex flex-wrap items-center justify-end gap-3">
										<WorkRefreshStatus />
										<WorkFilterMenu feed={feed} />
									</div>
								)}
								{tab === "threads" &&
									canFindConversations &&
									threads.length > 0 && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="ml-auto pointer-coarse:min-h-11"
											onClick={(event) =>
												openMatchReview(
													event.currentTarget,
												)
											}
										>
											<Search aria-hidden="true" />
											Find conversations
										</Button>
									)}
							</div>
							<TabsContent value="actions" className="mt-0">
								<WorkItemsList feed={feed} />
							</TabsContent>
							<TabsContent value="threads" className="mt-0">
								{/* the tab already says Threads; this line only counts them */}
								{threads.length > 0 && (
									<P className="px-4 py-3 text-muted-foreground text-sm tabular-nums md:px-5">
										{threads.length}{" "}
										{threads.length === 1
											? "thread"
											: "threads"}
										{feedThreadCount > 0 && (
											<>
												{" \u00b7 "}
												<span>
													{feedThreadCount} in your
													feed
												</span>
											</>
										)}
									</P>
								)}
								{threads.length ? (
									<ul
										aria-label="Topic threads"
										className="divide-y divide-border border-t"
									>
										{threads.map((thread) => (
											<TopicThreadRow
												key={thread.id}
												thread={thread}
												topicId={topic.id}
												items={workItems.filter(
													(item) =>
														item.threadId ===
														thread.id,
												)}
											/>
										))}
									</ul>
								) : canFindConversations ? (
									<div className="flex flex-col items-start gap-3 px-5 py-4">
										<P className="text-muted-foreground text-sm">
											No threads in this topic yet. Find
											conversations that fit it, or add it
											from a thread's details.
										</P>
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="pointer-coarse:min-h-11"
											onClick={(event) =>
												openMatchReview(
													event.currentTarget,
												)
											}
										>
											<Search aria-hidden="true" />
											Find conversations
										</Button>
									</div>
								) : (
									<P className="px-5 py-4 text-muted-foreground text-sm">
										No threads in this topic yet. Add it
										from a thread's details.
									</P>
								)}
							</TabsContent>
							<TabsContent value="sessions" className="mt-0">
								{tab === "sessions" && (
									<TopicSessions topicId={topic.id} />
								)}
							</TabsContent>
						</Tabs>
					</Card>
				</div>
				<aside
					ref={contextRef}
					tabIndex={-1}
					id={`${fieldId}-context`}
					hidden={!isContextOpen}
					aria-label="Topic context"
					className="min-w-0 divide-y divide-border focus-visible:outline-2 focus-visible:outline-ring xl:pt-1 [&>section:first-of-type]:pt-0 [&>section]:py-6"
				>
					<div className="flex items-center justify-between gap-3 pb-4 xl:hidden">
						<H2 className={contextHeadingClassName}>
							Topic context
						</H2>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="pointer-coarse:size-11"
							aria-label="Close topic context"
							onClick={() => {
								setIsContextOpen(false);
								contextButtonRef.current?.focus();
							}}
						>
							<X aria-hidden="true" />
						</Button>
					</div>
					<section aria-labelledby={`${fieldId}-goals`}>
						<div>
							<div className={asideHeaderClassName}>
								<div className="min-w-0 space-y-1.5">
									<H2
										id={`${fieldId}-goals`}
										className="font-display font-semibold text-base"
									>
										Goals
									</H2>
									<div className="flex flex-wrap items-center gap-3">
										{topic.goals.length > 0 && (
											<Progress
												aria-label="Goals completed"
												aria-valuenow={
													(doneGoals.length /
														topic.goals.length) *
													100
												}
												aria-valuetext={`${doneGoals.length} of ${topic.goals.length} complete`}
												className={cn(
													"h-1.5 w-16 bg-muted [&>div]:motion-reduce:transition-none",
													doneGoals.length ===
														topic.goals.length &&
														"[&>div]:bg-success",
												)}
												value={
													(doneGoals.length /
														topic.goals.length) *
													100
												}
											/>
										)}
										<Small className="font-normal text-muted-foreground text-xs tabular-nums">
											<output>
												{topic.goals.length
													? `${doneGoals.length} of ${topic.goals.length} complete`
													: "No goals yet"}
											</output>
										</Small>
									</div>
								</div>
								<TopicGoalPopover topicId={topic.id} />
							</div>
							{topic.goals.length > 0 ? (
								<ul
									aria-label="Topic goals"
									className="divide-y divide-border border-t"
								>
									{topic.goals.map((goal) => (
										<li
											key={goal.noteId}
											className="flex items-start gap-3 py-2.5"
										>
											<Checkbox
												id={`${fieldId}-${goal.noteId}`}
												checked={goal.status === "done"}
												className="after:-inset-2.5 relative size-5 rounded-full border-muted-foreground bg-background shadow-none after:absolute after:content-[''] data-[state=checked]:border-success data-[state=checked]:bg-success/10 data-[state=checked]:text-foreground dark:data-[state=checked]:bg-success/10"
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
											<div className="min-w-0 flex-1 space-y-2">
												<Label
													htmlFor={`${fieldId}-${goal.noteId}`}
													className="wrap-anywhere block min-w-0 cursor-pointer whitespace-pre-wrap font-normal text-foreground text-sm leading-5"
												>
													{goal.text}
												</Label>
												{goal.resolution && (
													<div className="space-y-1.5 rounded-lg bg-muted/60 p-3">
														<Small className="flex items-center gap-2 font-medium text-foreground text-xs leading-5">
															<Bot
																aria-hidden="true"
																className="size-4 shrink-0 text-muted-foreground"
															/>
															AI accomplishment
														</Small>
														<P className="wrap-anywhere max-w-prose whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
															{goal.resolution}
														</P>
													</div>
												)}
											</div>
										</li>
									))}
								</ul>
							) : (
								<P className="text-muted-foreground text-sm">
									Add a goal for you and your assistant to
									work toward.
								</P>
							)}
						</div>
					</section>
					<section aria-labelledby={`${fieldId}-people`}>
						<div>
							<div className={asideHeaderClassName}>
								<div className="flex items-center gap-3">
									<H2
										id={`${fieldId}-people`}
										className={contextHeadingClassName}
									>
										People
									</H2>
									<Small className="font-normal text-muted-foreground tabular-nums">
										{members.length}
									</Small>
								</div>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Add people"
											className="text-muted-foreground"
										>
											<Plus aria-hidden="true" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										align="end"
										aria-label="Add people"
										className="space-y-3"
									>
										<div className="flex flex-wrap items-center gap-2">
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
													className="h-9 w-full"
												>
													<SelectValue placeholder="Add someone to this topic" />
												</SelectTrigger>
												<SelectContent>
													{availablePeople.map(
														(person) => (
															<SelectItem
																key={person.id}
																value={
																	person.id
																}
															>
																{givenFirst(
																	person.name,
																)}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<Button
												variant="outline"
												size="sm"
												disabled={
													!availablePeople.some(
														(person) =>
															person.id ===
															personToAdd,
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
										<Small className={hintClassName}>
											Membership is separate from
											including a person's messages in
											assistant context.
										</Small>
									</PopoverContent>
								</Popover>
							</div>
							<div className="space-y-4">
								{MEMBERSHIPS.map(
									({
										state: membership,
										title,
										action,
										next,
									}) => {
										const rows = topic.people.filter(
											(person) =>
												person.state === membership,
										);
										const hidden =
											membership === "suggested" &&
											!showAllSuggested
												? rows.length -
													SUGGESTED_PREVIEW
												: 0;
										if (
											!rows.length &&
											membership !== "member"
										)
											return null;
										return (
											<section
												key={membership}
												className="space-y-3"
											>
												<H3
													className={
														membership === "member"
															? "sr-only"
															: "font-medium text-sm"
													}
												>
													{title}
												</H3>
												<div>
													{rows
														.slice(
															0,
															hidden > 0
																? SUGGESTED_PREVIEW
																: undefined,
														)
														.map((member) => {
															const personThreads =
																threads.filter(
																	(thread) =>
																		thread.participants.some(
																			(
																				participant,
																			) =>
																				participant.personId ===
																				member.personId,
																		),
																).length;
															const person =
																state.people.find(
																	(
																		candidate,
																	) =>
																		candidate.id ===
																		member.personId,
																);
															return (
																person && (
																	<div
																		key={
																			person.id
																		}
																		className="group/person flex items-center gap-3 py-1"
																	>
																		<PersonAvatar
																			name={
																				person.name
																			}
																			initials={
																				person.initials
																			}
																		/>
																		<div className="min-w-0 flex-1">
																			<Link
																				className="break-words font-medium text-sm hover:underline"
																				to={`/brain/people/${encodeURIComponent(person.id)}`}
																			>
																				{givenFirst(
																					person.name,
																				)}
																			</Link>
																			<Small className="block font-normal text-muted-foreground text-xs leading-5">
																				{(membership ===
																					"suggested" &&
																					member.reason) ||
																					`On ${personThreads} ${personThreads === 1 ? "thread" : "threads"}`}
																				<span>
																					{member.role
																						? ` · ${member.role}`
																						: ""}
																				</span>
																			</Small>
																		</div>
																		<Button
																			variant="ghost"
																			size="sm"
																			className={cn(
																				"font-normal",
																				// Remove stays out of the way until the row is hovered; Add and Restore are the decision
																				membership ===
																					"member" &&
																					"text-muted-foreground pointer-fine:opacity-0 pointer-fine:group-focus-within/person:opacity-100 pointer-fine:group-hover/person:opacity-100",
																			)}
																			onClick={() =>
																				dispatch(
																					{
																						type: "topic.person",
																						topicId:
																							topic.id,
																						personId:
																							person.id,
																						state: next,
																					},
																				)
																			}
																		>
																			{
																				action
																			}
																		</Button>
																	</div>
																)
															);
														})}
													{!rows.length && (
														<Small className="font-normal text-muted-foreground text-xs">
															No one added yet.
														</Small>
													)}
													{hidden > 0 && (
														<Button
															variant="ghost"
															size="sm"
															className="-ml-2 mt-1 font-normal text-muted-foreground"
															onClick={() =>
																setShowAllSuggested(
																	true,
																)
															}
														>
															Show {hidden} more
														</Button>
													)}
												</div>
											</section>
										);
									},
								)}
							</div>
						</div>
					</section>
					<section aria-labelledby={`${fieldId}-assistant-context`}>
						<div>
							<div className={asideHeaderClassName}>
								<H2
									id={`${fieldId}-assistant-context`}
									className={contextHeadingClassName}
								>
									Assistant
								</H2>
							</div>
							<div className="space-y-3">
								<div className="flex items-center justify-between gap-2">
									<H3 className="font-medium text-sm">
										Keywords
									</H3>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Add keyword"
												className="text-muted-foreground"
											>
												<Plus aria-hidden="true" />
											</Button>
										</PopoverTrigger>
										<PopoverContent
											align="end"
											aria-label="Add keyword"
										>
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
										</PopoverContent>
									</Popover>
								</div>
								{topic.keywords.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{topic.keywords.map((word) => (
											<Badge
												key={word}
												variant="outline"
												className="max-w-full gap-1 whitespace-normal break-all pr-1 font-normal"
											>
												{word}
												<Button
													type="button"
													aria-label={`Remove keyword ${word}`}
													onClick={() =>
														dispatch({
															type: "topic.save",
															topic: {
																id: topic.id,
																keywords:
																	topic.keywords.filter(
																		(
																			item,
																		) =>
																			item !==
																			word,
																	),
															},
														})
													}
													variant="ghost"
													size="icon-sm"
													className="size-6 rounded-full text-muted-foreground"
												>
													<X
														className="size-3"
														aria-hidden="true"
													/>
												</Button>
											</Badge>
										))}
									</div>
								)}
								<P className="text-muted-foreground text-sm leading-relaxed">
									{topic.keywords.length
										? "New threads that match are filed here."
										: "Add keywords so new threads are filed here on their own."}
								</P>
								{topic.calendarSeries.length > 0 && (
									<div className="space-y-1 border-t pt-3">
										<Small className={hintClassName}>
											Calendar series
										</Small>
										{topic.calendarSeries.map((series) => (
											<P
												key={series}
												className="break-words text-sm"
											>
												{series}
											</P>
										))}
									</div>
								)}
								<TopicFolders
									topicId={topic.id}
									folders={topic.folders ?? []}
									isSample={topic.isSample}
								/>
								<Collapsible
									open={areNotesOpen}
									onOpenChange={setAreNotesOpen}
									className="border-t pt-3"
								>
									<CollapsibleTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="group -ml-2 font-medium"
										>
											<ChevronDown
												aria-hidden="true"
												className="-rotate-90 group-data-[state=open]:rotate-0"
											/>
											Notes for the assistant
										</Button>
									</CollapsibleTrigger>
									<CollapsibleContent
										forceMount
										hidden={!areNotesOpen}
										className="space-y-3 pt-2"
									>
										<MemoryList
											memories={topicMemories}
											emptyText="Notes here help the assistant with this topic and its threads."
											addLabel="New note"
											about={{
												type: "topic",
												id: topic.id,
											}}
											isSample={topic.isSample}
										/>
										<Small className={hintClassName}>
											Goals and notes are used in chats
											and threads linked to this topic.
										</Small>
									</CollapsibleContent>
								</Collapsible>
							</div>
						</div>
					</section>
					<section aria-labelledby={`${fieldId}-settings`}>
						<H2
							id={`${fieldId}-settings`}
							className={cn(contextHeadingClassName, "pb-3")}
						>
							Topic settings
						</H2>
						<div className="flex flex-wrap items-center gap-1">
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
									className="h-8 w-auto gap-2 border-0 bg-transparent px-2 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground dark:bg-transparent"
								>
									<span
										aria-hidden="true"
										className={cn(
											"size-2 shrink-0 rounded-full",
											topic.status === "active"
												? "bg-success"
												: topic.status === "suggested"
													? "bg-warning"
													: "bg-muted-foreground",
										)}
									/>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">
										Active
									</SelectItem>
									<SelectItem value="dormant">
										Dormant
									</SelectItem>
									<SelectItem value="archived">
										Archived
									</SelectItem>
									{topic.status === "suggested" && (
										<SelectItem value="suggested">
											Suggested
										</SelectItem>
									)}
								</SelectContent>
							</Select>
							<Button
								variant="ghost"
								size="sm"
								aria-label={`${topic.kind} · ${accountName}: Edit topic kind and account`}
								className="h-auto min-h-8 max-w-full font-normal text-muted-foreground"
								onClick={(event) => {
									editButtonRef.current = event.currentTarget;
									setIsEditing(true);
								}}
							>
								<LockKeyhole
									aria-hidden="true"
									className="shrink-0 text-muted-foreground"
								/>
								<span className="min-w-0 whitespace-normal break-words text-left">
									<span className="capitalize">
										{topic.kind}
									</span>{" "}
									· {accountName}
								</span>
								<ChevronDown
									aria-hidden="true"
									className="shrink-0 text-muted-foreground"
								/>
							</Button>
						</div>
					</section>
				</aside>
			</div>
			{isEditing && (
				<TopicEditor
					returnFocusRef={editButtonRef}
					topic={topic}
					onClose={() => setIsEditing(false)}
					onFindConversations={
						canFindConversations
							? () => openMatchReview()
							: undefined
					}
				/>
			)}
			{updates && canFindConversations && (
				<TopicMatchesDialog
					// an edit to what Brain matches on starts the review over
					key={`${topic.name}\n${topic.description}\n${topic.accountId ?? ""}`}
					topic={topic}
					updates={updates}
					open={isMatchReviewOpen}
					onOpenChange={setIsMatchReviewOpen}
					returnFocusRef={matchTriggerRef}
				/>
			)}
		</CollaborationPage>
	);
}
