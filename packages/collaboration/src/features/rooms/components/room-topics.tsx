import { Check, Plus } from "lucide-react";
import { useContext, useState } from "react";
import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { TopicChip } from "@/features/collaboration/components/topic-chip";
import { useRecordIds } from "@/features/collaboration/live/work-updates.context";
import type { Topic } from "@/features/collaboration/state/collaboration.types";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { RoomTopicsContext } from "./room-topics.context";

/** Topic chips in the chat header: linked topics, Brain's suggestions to accept or dismiss, and a picker. The chat's topics come from RoomView. */
export function RoomTopics() {
	const session = useOptionalCollaborationSession();
	const roomTopics = useContext(RoomTopicsContext);
	const { localId } = useRecordIds();
	const [open, setOpen] = useState(false);
	if (!roomTopics?.topics || !session) return null;
	const { topics, change } = roomTopics;

	// the page knows a topic made here by its own id; the chat's links carry the server's
	const byId = new Map<string, Topic>(
		session.state.topics.map((topic) => [topic.id, topic]),
	);
	const shown = topics.filter(
		(t) => t.state !== "dismissed" && byId.has(localId(t.topicId)),
	);
	const onChat = new Set(
		topics
			.filter((t) => t.state !== "dismissed")
			.map((t) => localId(t.topicId)),
	);
	const choices = session.state.topics.filter(
		(topic) =>
			(topic.status === "active" || topic.status === "dormant") &&
			!onChat.has(topic.id),
	);

	return (
		<fieldset
			className="flex min-w-0 shrink items-center gap-1 overflow-x-auto border-0 p-0"
			aria-label="Chat topics"
		>
			{shown.map((t) => {
				const topic = byId.get(localId(t.topicId)) as Topic;
				const suggested = t.state === "suggested";
				const byBrain = t.origin === "brain" || t.origin === "agent";
				return (
					<span
						key={t.topicId}
						className="inline-flex items-center gap-0.5"
					>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<TopicChip
										topic={topic}
										suggested={suggested}
										onRemove={() =>
											void change(t.topicId, true)
										}
										removeLabel={
											suggested
												? `Dismiss ${topic.short}`
												: `Remove ${topic.short} from this chat`
										}
									/>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{suggested
									? `Suggested: this chat may be about ${topic.name}`
									: byBrain
										? `Tagged ${topic.name} automatically; remove it if that is wrong`
										: `This chat is about ${topic.name}`}
							</TooltipContent>
						</Tooltip>
						{suggested && (
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="size-6 text-muted-foreground"
								aria-label={`Accept ${topic.short}`}
								onClick={() => void change(t.topicId, false)}
							>
								<Check aria-hidden="true" />
							</Button>
						)}
					</span>
				);
			})}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-7 shrink-0 gap-1 px-2 text-muted-foreground"
						aria-label="Add a topic to this chat"
					>
						<Plus aria-hidden="true" className="size-3.5" />
						{shown.length === 0 && (
							<span className="text-xs">Topic</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="max-h-72 w-64 overflow-y-auto p-1"
					aria-label="Add a topic"
				>
					{choices.length === 0 ? (
						<p className="px-2 py-1.5 text-muted-foreground text-sm">
							No other topics
						</p>
					) : (
						choices.map((topic) => (
							<Button
								key={topic.id}
								type="button"
								variant="ghost"
								className="h-8 w-full justify-start px-2 font-normal text-sm"
								onClick={() => {
									setOpen(false);
									void change(topic.id, false);
								}}
							>
								{topic.name}
							</Button>
						))
					)}
				</PopoverContent>
			</Popover>
		</fieldset>
	);
}
