import { cn } from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";
import { topicColor } from "../topic-color";

interface TopicDotProps {
	/** The topic or topic-like object to display the color dot for */
	topic?: Topic | { id: string; color?: string };
	/** CSS class for sizing (e.g., "size-2", "size-2.5"). Defaults to "size-2" */
	size?: string;
	/** Additional CSS classes */
	className?: string;
}

/** Semantic color dot for a topic, using custom color if set or automatic hashed color. */
export function TopicDot({ topic, size = "size-2", className }: TopicDotProps) {
	if (!topic) return null;

	const topicObj = {
		id: topic.id,
		color: topic.color || "",
	};
	const { backgroundColor } = topicColor(topicObj);

	return (
		<span
			aria-hidden="true"
			className={cn(size, "shrink-0 rounded-full", className)}
			style={{ backgroundColor }}
		/>
	);
}
