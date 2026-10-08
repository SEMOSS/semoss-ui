import { ChevronRight, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";
import { TopicEditor } from "./topic-editor";

interface CollaborationTopicsNavigationProps {
	/** The user's saved topic disclosure state. */
	isOpen: boolean;
	/** Updates the topic disclosure without changing the current route. */
	onOpenChange: (isOpen: boolean) => void;
	/** Keeps an editor mounted when the surrounding mobile drawer closes. */
	onNewTopic?: (trigger: HTMLButtonElement) => void;
	/** Closes mobile navigation when a topic is selected. */
	onNavigate?: () => void;
}

/** Topics connect the daily work feed with its underlying Brain records. */
export function CollaborationTopicsNavigation({
	isOpen,
	onOpenChange,
	onNewTopic,
	onNavigate,
}: CollaborationTopicsNavigationProps) {
	const { state } = useCollaborationSession();
	const { pathname } = useLocation();
	const [isCreatingTopic, setIsCreatingTopic] = useState(false);
	const newTopicRef = useRef<HTMLButtonElement>(null);
	const topics = state.topics.filter((topic) => topic.status !== "archived");
	return (
		<Collapsible open={isOpen} onOpenChange={onOpenChange} asChild>
			<section
				aria-label="Topics"
				className="flex max-h-72 min-h-0 shrink-0 flex-col px-2"
			>
				<div className="flex shrink-0 items-center gap-1">
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="pointer-coarse:min-h-11 min-w-0 flex-1 justify-start gap-2 px-2 font-normal text-muted-foreground text-xs has-[>svg]:px-2"
						>
							<ChevronRight
								aria-hidden="true"
								className={cn("size-4", isOpen && "rotate-90")}
							/>
							Topics
						</Button>
					</CollapsibleTrigger>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								ref={newTopicRef}
								variant="ghost"
								size="icon-sm"
								aria-label="New topic"
								className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 text-muted-foreground"
								onClick={(event) => {
									if (onNewTopic)
										onNewTopic(event.currentTarget);
									else setIsCreatingTopic(true);
								}}
							>
								<Plus aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>New topic</TooltipContent>
					</Tooltip>
				</div>
				<CollapsibleContent className="min-h-0 overflow-y-auto">
					<nav aria-label="Topics" className="space-y-0.5">
						{topics.map((topic) => {
							const count = selectWorkItems(state, {
								view: "needs_me",
								topicId: topic.id,
							}).total;
							return (
								<NavLink
									key={topic.id}
									aria-label={`${topic.short}: ${topic.name}`}
									to={`${pathname.startsWith("/brain") ? "/brain/topics" : "/work/topic"}/${encodeURIComponent(topic.id)}`}
									onClick={onNavigate}
									className={({ isActive }) =>
										cn(
											"flex min-h-8 pointer-coarse:min-h-11 items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring",
											isActive &&
												"bg-sidebar-accent font-medium",
										)
									}
								>
									<span
										aria-hidden="true"
										className={cn(
											"size-2 shrink-0 rounded-xs",
											topicTone(topic.id),
										)}
									/>
									<span
										className="truncate"
										title={topic.name}
									>
										{topic.short}
									</span>
									{count > 0 && (
										<span className="ml-auto shrink-0 text-muted-foreground text-xs tabular-nums">
											{count}
										</span>
									)}
								</NavLink>
							);
						})}
						{topics.length === 0 && (
							<Small className="p-2 text-muted-foreground text-xs leading-4">
								Add a topic to organize your work.
							</Small>
						)}
					</nav>
				</CollapsibleContent>
				{isCreatingTopic && (
					<TopicEditor
						returnFocusRef={newTopicRef}
						onClose={() => setIsCreatingTopic(false)}
					/>
				)}
			</section>
		</Collapsible>
	);
}
