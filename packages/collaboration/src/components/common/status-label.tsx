import { Check, CircleAlert, Clock3 } from "lucide-react";
import { cn, Spinner } from "@semoss/ui/next";
import type { Session } from "@/types/session";

export function StatusLabel({ status }: { status: Session["status"] }) {
	const working = status === "In progress";
	const complete = status === "Ready";
	const needsReview = status === "Your review";
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs",
				working
					? "text-primary"
					: needsReview
						? "text-warning"
						: complete
							? "text-success"
							: "text-muted-foreground",
			)}
		>
			{working ? (
				<Spinner
					className="size-3.5 motion-reduce:animate-none"
					aria-hidden="true"
				/>
			) : needsReview ? (
				<CircleAlert className="size-3.5" aria-hidden="true" />
			) : complete ? (
				<Check className="size-3.5" aria-hidden="true" />
			) : (
				<Clock3 className="size-3.5" aria-hidden="true" />
			)}
			{working ? "Working" : status}
		</span>
	);
}
