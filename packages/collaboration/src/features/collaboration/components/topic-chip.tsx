import { Link } from "react-router";
import { Badge, cn } from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";

const tones = [
	"bg-chart-1/15",
	"bg-chart-2/15",
	"bg-chart-3/15",
	"bg-chart-4/15",
	"bg-chart-5/15",
];

/** Consistent topic identity using shared semantic data colors. */
export function TopicChip({
	topic,
	suggested = false,
}: {
	topic: Topic;
	suggested?: boolean;
}) {
	const index =
		[...topic.id].reduce(
			(value, letter) => value + letter.charCodeAt(0),
			0,
		) % tones.length;
	return (
		<Badge
			asChild
			variant="outline"
			className={cn(
				"text-foreground",
				tones[index],
				suggested && "border-dashed",
			)}
		>
			<Link to={`/brain/topics/${encodeURIComponent(topic.id)}`}>
				{topic.short}
				{suggested ? "?" : ""}
			</Link>
		</Badge>
	);
}
