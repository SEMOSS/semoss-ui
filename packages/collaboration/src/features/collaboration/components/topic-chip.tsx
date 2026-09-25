import { X } from "lucide-react";
import { Link } from "react-router";
import { Badge, cn } from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";

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
	const tones = [
		{ dot: "bg-chart-1", tint: "bg-chart-1/10" },
		{ dot: "bg-chart-2", tint: "bg-chart-2/10" },
		{ dot: "bg-chart-3", tint: "bg-chart-3/10" },
		{ dot: "bg-chart-4", tint: "bg-chart-4/10" },
		{ dot: "bg-chart-5", tint: "bg-chart-5/10" },
	];
	const tone =
		tones[
			[...topic.id].reduce(
				(value, letter) => value + letter.charCodeAt(0),
				0,
			) % tones.length
		];
	const className = cn(
		"gap-1.5 rounded-full border-transparent px-2.5 py-1 font-medium text-foreground text-xs",
		tone?.tint,
		suggested &&
			"border-border border-dashed bg-transparent text-muted-foreground",
	);
	const label = (
		<>
			<span
				aria-hidden="true"
				className={cn("size-1.5 shrink-0 rounded-full", tone?.dot)}
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
