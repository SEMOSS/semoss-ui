import { ArrowUpRight } from "lucide-react";
import { Button, cn } from "@semoss/ui/next";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useDashboard } from "./dashboard.context";
import { eventStart } from "./dashboard-calendar";

/** Suggestions are grounded in available meetings/topics and only populate a draft. */
export function BriefSuggestions({
	onSelect,
	topicId,
	compact = false,
	presentation = "brief",
	disabled = false,
	hidden = false,
	className,
}: {
	onSelect: (prompt: string) => void;
	topicId?: string;
	compact?: boolean;
	presentation?: "brief" | "chat";
	/** Prevent replacing a draft while its first message is being submitted. */
	disabled?: boolean;
	/** Keep the centered input in place while suggestions are concealed during editing. */
	hidden?: boolean;
	/** Layout alignment supplied by the owning Brief or new-chat surface. */
	className?: string;
}) {
	const { state } = useCollaborationSession();
	const { calendar } = useDashboard();
	const next = (calendar.data ?? [])
		.filter((event) => (eventStart(event)?.getTime() ?? 0) >= Date.now())
		.sort(
			(left, right) =>
				(eventStart(left)?.getTime() ?? 0) -
				(eventStart(right)?.getTime() ?? 0),
		)[0];
	const topic =
		state.topics.find((candidate) => candidate.id === topicId) ??
		state.topics.find((candidate) => candidate.status === "active");
	const suggestions = [
		next?.subject
			? `Brief me for ${next.subject}`
			: "What needs my attention today?",
		topic
			? `What changed on ${topic.short || topic.name} this week?`
			: "What changed this week?",
		"Who am I waiting on?",
		"What decisions need me?",
	];
	return (
		<fieldset
			aria-label="Suggested questions"
			aria-hidden={hidden || undefined}
			disabled={disabled || hidden}
			className={cn(
				presentation === "chat"
					? "grid min-w-0 @2xl/conversation:grid-cols-2 grid-cols-1 gap-2"
					: "flex flex-wrap gap-2",
				presentation === "brief" && !compact && "flex-col items-start",
				hidden && "invisible",
				className,
			)}
		>
			{suggestions.map((prompt) => (
				<Button
					key={prompt}
					type="button"
					variant={
						compact || presentation === "chat"
							? "outline"
							: "secondary"
					}
					onClick={() => onSelect(prompt)}
					className={cn(
						"h-auto max-w-full justify-start whitespace-normal rounded-lg px-3 py-2 text-left font-normal text-sm leading-5",
						compact && "rounded-full bg-card py-1.5",
						presentation === "chat" &&
							"min-h-12 min-w-0 justify-between gap-3 rounded-xl bg-transparent px-4 py-3 text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground",
					)}
				>
					<span className="min-w-0 break-words">{prompt}</span>
					{presentation === "chat" && (
						<ArrowUpRight
							aria-hidden="true"
							className="size-4 shrink-0"
						/>
					)}
				</Button>
			))}
		</fieldset>
	);
}
