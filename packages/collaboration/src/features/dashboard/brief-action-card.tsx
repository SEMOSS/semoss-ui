import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	H3,
	P,
} from "@semoss/ui/next";
import { ThreadMenu } from "@/features/collaboration/components/thread-menu";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { topicTone } from "@/features/collaboration/topic-tone";
import { threadPath } from "@/lib/workspace-paths";
import { BriefDeadline } from "./brief-deadline";

/** One task per row: one main action and Done; context and the rest stay one click away. */
export function BriefActionCard({ item }: { item: WorkItem }) {
	const { state, dispatch } = useCollaborationSession();
	const [isOpen, setIsOpen] = useState(false);
	const thread = state.threads.find(
		(candidate) => candidate.id === item.threadId,
	);
	if (!thread) return null;
	const person = state.people.find(
		(candidate) => candidate.id === item.actorId,
	);
	const topic = state.topics.find((candidate) =>
		item.topicIds.includes(candidate.id),
	);
	const draft = state.workspaces[thread.id]?.drafts[0];
	const context =
		draft?.body || thread.summary || item.reasons.join(" \u00b7 ");
	const path = threadPath(thread.id);
	return (
		<ThreadMenu thread={thread} item={item}>
			{(menu) => (
				<Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
					<article className="min-w-0 border-b last:border-b-0">
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
							<div className="min-w-0 flex-1 basis-64 space-y-1">
								<H3 className="font-medium text-sm leading-snug">
									<Link
										to={path}
										className="break-words hover:underline"
									>
										{item.title}
									</Link>
								</H3>
								<P className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground text-xs">
									<span>{person?.name ?? "You"}</span>
									{topic && (
										<>
											<span aria-hidden="true">
												{"\u00b7"}
											</span>
											<span
												className={cn(
													"size-2 shrink-0 rounded-xs",
													topicTone(topic.id),
												)}
												aria-hidden="true"
											/>
											<span>
												{topic.short || topic.name}
											</span>
										</>
									)}
									{/* only real deadlines and urgent items; "high priority" on every row reads as pressure */}
									{(item.due || item.priority === "P0") && (
										<>
											<span aria-hidden="true">
												{"\u00b7"}
											</span>
											<BriefDeadline
												item={item}
												timeZone={
													state.profile.timezone
												}
											/>
										</>
									)}
								</P>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									asChild
									size="sm"
									variant="outline"
									className="font-normal"
								>
									<Link to={path}>
										{item.askType === "reply"
											? "Review reply"
											: item.askType === "approve"
												? "Review decision"
												: "Open"}
									</Link>
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="font-normal text-muted-foreground"
									onClick={() =>
										dispatch({
											type: "item.update",
											itemId: item.id,
											changes: { status: "done" },
										})
									}
								>
									Done
								</Button>
								<CollapsibleTrigger asChild>
									<Button
										size="icon-sm"
										variant="ghost"
										aria-label={
											isOpen
												? "Hide details"
												: "Show details"
										}
										className="text-muted-foreground"
									>
										<ChevronDown
											aria-hidden="true"
											className={cn(
												"size-4",
												isOpen && "rotate-180",
											)}
										/>
									</Button>
								</CollapsibleTrigger>
								{menu}
							</div>
						</div>
						<CollapsibleContent className="space-y-3 px-4 pb-4">
							{context && (
								// plain text under the title; a box inside the list's box is one container too many
								<div className="max-w-prose">
									<P className="mb-1 text-muted-foreground text-xs">
										{draft ? "Draft reply" : "Context"}
									</P>
									<P className="line-clamp-6 whitespace-pre-line text-sm leading-relaxed">
										{context}
									</P>
								</div>
							)}
							<Button
								asChild
								size="sm"
								variant="outline"
								className="font-normal"
							>
								<Link
									to={path}
									state={{
										threadAction: {
											id: crypto.randomUUID(),
											threadId: thread.id,
											action: "ask",
											prompt: `Help me with: ${item.title}`,
										},
									}}
								>
									Ask about this
								</Link>
							</Button>
						</CollapsibleContent>
					</article>
				</Collapsible>
			)}
		</ThreadMenu>
	);
}
