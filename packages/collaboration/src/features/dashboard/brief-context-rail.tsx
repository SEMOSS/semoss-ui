import { cn } from "@semoss/ui/next";
import { BriefDay } from "./brief-day";
import { BriefHandled } from "./brief-handled";
import { BriefNeeds } from "./brief-needs";

/** Daily context reused alongside a chat, independently of its conversation state. */
export function BriefContextRail({
	topicId,
	className,
}: {
	topicId?: string;
	/** Let an enclosing chat canvas supply its own spacing and background. */
	className?: string;
}) {
	return (
		<aside
			aria-label="Your daily context"
			className={cn(
				"min-h-0 min-w-0 space-y-6 bg-muted/15 p-5",
				className,
			)}
		>
			<BriefNeeds topicId={topicId} />
			<BriefDay />
			<BriefHandled topicId={topicId} />
		</aside>
	);
}
