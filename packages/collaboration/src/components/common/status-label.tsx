import { Check, CircleAlert, Clock3 } from "lucide-react";
import { cn, Spinner } from "@semoss/ui/next";

export function StatusLabel({ status }: { status: string }) {
	const working = status === "In progress";
	const complete = status === "Ready" || status === "Completed";
	const needsReview = status === "Your review";
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs",
				working
					? "text-chart-3"
					: needsReview
						? "text-chart-4"
						: complete
							? "text-link"
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
