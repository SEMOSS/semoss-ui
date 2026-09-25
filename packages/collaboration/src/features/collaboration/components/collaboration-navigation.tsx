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
import { NavLink, useLocation, useNavigate } from "react-router";
import { Button, cn, Small } from "@semoss/ui/next";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
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
					count: selectWorkItems(state).total,
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
		<div className="flex min-h-full flex-col gap-6 p-3">
			<nav aria-label={isBrain ? "Brain" : "Work"} className="space-y-1">
				{links.map(({ to, label, icon: Icon, count }) => (
					<NavLink
						end={to === "/work" || to === "/brain"}
						key={to}
						to={to}
						onClick={onNavigate}
						className={({ isActive }) =>
							cn(
								"flex min-h-11 items-center gap-2 rounded-md px-3 py-2 font-medium text-sm hover:bg-accent",
								isActive
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground",
							)
						}
					>
						<Icon aria-hidden="true" className="size-4 shrink-0" />
						<span>{label}</span>
						{count !== undefined && (
							<span className="ml-auto text-xs tabular-nums">
								{count}
							</span>
						)}
					</NavLink>
				))}
			</nav>
			<div>
				<div className="mb-2 flex items-center justify-between px-3">
					<Small className="font-medium text-muted-foreground">
						Topics
					</Small>
					<Button
						variant="ghost"
						size="icon-sm"
						ref={newTopicRef}
						aria-label="New topic"
						onClick={() => setIsCreatingTopic(true)}
					>
						<Plus aria-hidden="true" />
					</Button>
				</div>
				<nav aria-label="Topics" className="space-y-1">
					{state.topics
						.filter((topic) => topic.status !== "archived")
						.map((topic) => (
							<NavLink
								key={topic.id}
								to={`/${isBrain ? "brain/topics" : "work/topic"}/${encodeURIComponent(topic.id)}`}
								onClick={onNavigate}
								className={({ isActive }) =>
									cn(
										"flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
										isActive &&
											"bg-background font-medium shadow-sm",
									)
								}
							>
								<span
									className="size-2 shrink-0 rounded-full bg-primary"
									aria-hidden="true"
								/>
								<span className="truncate">{topic.short}</span>
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
					<Small className="mb-2 px-3 font-medium text-muted-foreground">
						Open rooms
					</Small>
					<nav aria-label="Open rooms">
						{state.openThreadIds.map((id) => {
							const thread = state.threads.find(
								(candidate) => candidate.id === id,
							);
							return (
								thread && (
									<div
										key={id}
										className="flex items-center gap-1"
									>
										<NavLink
											to={`/work/thread/${encodeURIComponent(id)}`}
											onClick={onNavigate}
											className={({ isActive }) =>
												cn(
													"min-w-0 flex-1 truncate rounded-md px-3 py-2 text-sm hover:bg-accent",
													isActive &&
														"bg-background font-medium",
												)
											}
										>
											{thread.subject}
										</NavLink>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Close ${thread.subject}`}
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
								)
							);
						})}
					</nav>
				</div>
			)}
			<Small className="mt-auto px-3 text-muted-foreground">
				Sample scenario · Sep 24, 2026
				<br />
				Brain and Work edits last for this session. Conversations and
				Outlook drafts are saved separately.
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
