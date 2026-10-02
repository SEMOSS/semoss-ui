import {
	Brain,
	Check,
	Clock,
	Inbox,
	ListFilter,
	Plus,
	Settings2,
	UserRound,
	Users,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { Button, cn, Small } from "@semoss/ui/next";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";
import { ThreadMenu } from "./thread-menu";
import { TopicEditor } from "./topic-editor";

/** One navigation model shared by desktop and mobile shells. */
export function CollaborationNavigation({
	onNavigate,
}: {
	onNavigate?: () => void;
}) {
	const { state, dispatch } = useCollaborationSession();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const newTopicRef = useRef<HTMLButtonElement>(null);
	const [isCreatingTopic, setIsCreatingTopic] = useState(false);
	const isBrain = pathname.startsWith("/brain");
	const links = isBrain
		? [
				{
					to: "/brain",
					label: "Review",
					icon: Brain,
					count:
						state.reviews.filter(
							(review) => review.status === "open",
						).length +
						state.topics.reduce(
							(count, topic) =>
								count +
								topic.notes.filter(
									(note) => note.status === "draft",
								).length,
							0,
						),
				},
				{ to: "/brain/profile", label: "About you", icon: UserRound },
				{
					to: "/brain/people",
					label: "People",
					icon: Users,
					count: state.people.length,
				},
				{
					to: "/brain/threads",
					label: "Threads",
					icon: ListFilter,
					count: state.threads.length,
				},
				{
					to: "/brain/sources",
					label: "Sources and rules",
					icon: Settings2,
				},
			]
		: [
				{
					to: "/work",
					label: "For you",
					icon: Inbox,
					count: selectWorkItems(state, { view: "needs_me" }).total,
				},
				{
					to: "/work/waiting",
					label: "Waiting on others",
					icon: Clock,
					count: selectWorkItems(state, { view: "waiting" }).total,
				},
				{
					to: "/work/done",
					label: "Done",
					icon: Check,
					count: selectWorkItems(state, { view: "done_today" }).total,
				},
			];
	return (
		<div className="flex min-h-full flex-col gap-4 px-3 pt-4">
			<Button asChild className="min-h-9 pointer-coarse:min-h-11">
				<Link to="/new" onClick={onNavigate}>
					<Plus aria-hidden="true" />
					New session
				</Link>
			</Button>
			<nav
				aria-label={isBrain ? "Brain" : "Work"}
				className="space-y-0.5"
			>
				{links.map(({ to, label, icon: Icon, count }) => (
					<NavLink
						end={to === "/work" || to === "/brain"}
						key={to}
						to={to}
						onClick={onNavigate}
						className={({ isActive }) =>
							cn(
								"group relative flex min-h-11 pointer-coarse:min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring lg:min-h-9 [&>svg]:text-muted-foreground",
								isActive &&
									"bg-foreground/5 font-medium before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-primary [&>svg]:text-primary",
							)
						}
					>
						<Icon aria-hidden="true" className="size-4 shrink-0" />
						<span>{label}</span>
						{count !== undefined && (
							<span
								className={cn(
									"ml-auto font-normal text-muted-foreground tabular-nums group-aria-[current=page]:font-medium group-aria-[current=page]:text-primary",
									to === "/brain" &&
										count > 0 &&
										"rounded-full bg-primary px-1.5 text-primary-foreground text-xs group-aria-[current=page]:text-primary-foreground",
								)}
							>
								{count}
							</span>
						)}
					</NavLink>
				))}
			</nav>
			<div className="border-border border-t pt-4">
				<div className="mb-1 flex items-center justify-between pl-3">
					<Small className="font-medium text-muted-foreground">
						Topics
					</Small>
					<Button
						variant="ghost"
						size="icon-sm"
						className="pointer-coarse:size-11 text-muted-foreground"
						ref={newTopicRef}
						aria-label="New topic"
						onClick={() => setIsCreatingTopic(true)}
					>
						<Plus aria-hidden="true" />
					</Button>
				</div>
				<nav aria-label="Topics">
					{state.topics
						.filter((topic) => topic.status !== "archived")
						.map((topic) => (
							<NavLink
								key={topic.id}
								to={`/${isBrain ? "brain/topics" : "work/topic"}/${encodeURIComponent(topic.id)}`}
								onClick={onNavigate}
								className={({ isActive }) =>
									cn(
										"flex min-h-11 pointer-coarse:min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring lg:min-h-9",
										isActive &&
											"bg-foreground/5 font-medium",
									)
								}
							>
								<span
									className={cn(
										"size-2 shrink-0 rounded-xs",
										topicTone(topic.id),
									)}
									aria-hidden="true"
								/>
								<span className="truncate">{topic.short}</span>
								{!isBrain && (
									<span className="ml-auto text-muted-foreground tabular-nums">
										{selectWorkItems(state, {
											topicId: topic.id,
										}).total || ""}
									</span>
								)}
								{topic.status !== "active" && (
									<Small className="ml-auto text-muted-foreground text-xs">
										{topic.status}
									</Small>
								)}
							</NavLink>
						))}
				</nav>
			</div>
			{state.openThreadIds.length > 0 && (
				<div>
					<Small className="mb-1 px-3 font-medium text-muted-foreground">
						Open rooms
					</Small>
					<nav aria-label="Open rooms">
						{state.openThreadIds.map((id) => {
							const thread = state.threads.find(
								(candidate) => candidate.id === id,
							);
							return (
								thread && (
									<ThreadMenu
										key={id}
										thread={thread}
										onNavigate={onNavigate}
									>
										{(menu) => (
											<div className="group flex items-center gap-1">
												<NavLink
													to={`/work/thread/${encodeURIComponent(id)}`}
													onClick={onNavigate}
													className={({ isActive }) =>
														cn(
															"min-h-9 pointer-coarse:min-h-11 min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm before:mr-3 before:inline-block before:size-1.5 before:rounded-xs before:bg-muted-foreground hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring",
															isActive &&
																"bg-foreground/5 font-medium before:bg-primary",
														)
													}
												>
													{thread.subject}
												</NavLink>
												{menu}
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label={`Close ${thread.subject}`}
													className="pointer-coarse:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
													onClick={() => {
														dispatch({
															type: "workspace.close",
															threadId: id,
														});
														if (
															pathname ===
															`/work/thread/${encodeURIComponent(id)}`
														) {
															navigate("/work");
															onNavigate?.();
														}
													}}
												>
													<X aria-hidden="true" />
												</Button>
											</div>
										)}
									</ThreadMenu>
								)
							);
						})}
					</nav>
				</div>
			)}
			<Small className="-mx-3 mt-auto border-border border-t px-6 py-4 font-normal text-muted-foreground leading-relaxed">
				Work and Brain changes are saved to your account. Email drafts
				are saved in Outlook.
			</Small>
			{isCreatingTopic && (
				<TopicEditor
					returnFocusRef={newTopicRef}
					onClose={() => setIsCreatingTopic(false)}
				/>
			)}
		</div>
	);
}
