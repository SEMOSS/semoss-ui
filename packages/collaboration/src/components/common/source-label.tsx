import {
	CalendarDays,
	Clock3,
	Mail,
	MessageSquare,
	Webhook,
} from "lucide-react";
import type { Origin } from "@/types/origin";

const originIcons = {
	You: MessageSquare,
	Email: Mail,
	Scheduled: Clock3,
	Calendar: CalendarDays,
	Webhook,
};

export function SourceLabel({ origin }: { origin: Origin }) {
	const Icon = originIcons[origin];
	return (
		<span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
			<Icon className="size-3" aria-hidden="true" />
			{origin}
		</span>
	);
}
