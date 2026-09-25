import { Link } from "react-router";
import { Badge, cn } from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";

/** Consistent topic identity using shared semantic data colors. */
export function TopicChip({
	topic,
	suggested = false,
}: {
	topic: Topic;
	suggested?: boolean;
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
	return (
		<Badge
			asChild
			variant="outline"
			className={cn(
				"gap-1.5 rounded-full border-transparent px-2.5 py-1 font-medium text-foreground text-xs",
				tone?.tint,
				suggested &&
					"border-border border-dashed bg-transparent text-muted-foreground",
			)}
		>
			<Link to={`/brain/topics/${encodeURIComponent(topic.id)}`}>
				<span
					aria-hidden="true"
					className={cn("size-1.5 shrink-0 rounded-full", tone?.dot)}
				/>
				{topic.short}
				{suggested ? "?" : ""}
			</Link>
		</Badge>
	);
}
