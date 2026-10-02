import { X } from "lucide-react";
import { Link } from "react-router";
import { Badge, cn } from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";
import { topicTone } from "../topic-tone";

/** Consistent topic identity using shared semantic data colors; with onRemove, an x inside the pill removes it. */
export function TopicChip({
	topic,
	suggested = false,
	onRemove,
	removeLabel,
}: {
	topic: Topic;
	suggested?: boolean;
	onRemove?: () => void;
	removeLabel?: string;
}) {
	const className = cn(
		"gap-1.5 rounded-md border-transparent bg-muted px-2 py-0.5 font-normal text-foreground text-sm",
		suggested &&
			"border-border border-dashed bg-transparent text-muted-foreground",
	);
	const label = (
		<>
			<span
				aria-hidden="true"
				className={cn(
					"size-2 shrink-0 rounded-xs",
					topicTone(topic.id),
				)}
			/>
			{topic.short}
			{suggested ? "?" : ""}
		</>
	);
	const to = `/brain/topics/${encodeURIComponent(topic.id)}`;
	if (!onRemove)
		return (
			<Badge asChild variant="outline" className={className}>
				<Link to={to}>{label}</Link>
			</Badge>
		);
	return (
		<Badge variant="outline" className={cn(className, "pr-1")}>
			<Link to={to} className="inline-flex items-center gap-1.5">
				{label}
			</Link>
			<button
				type="button"
				aria-label={removeLabel ?? `Remove ${topic.short}`}
				onClick={onRemove}
				className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<X className="size-3" aria-hidden="true" />
			</button>
		</Badge>
	);
}
