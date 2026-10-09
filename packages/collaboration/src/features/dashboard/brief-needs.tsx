import { ArrowRight, CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { Button, cn, H2, P } from "@semoss/ui/next";
import { useForYou } from "@/features/for-you/for-you.context";
import { selectForYouItems } from "@/features/for-you/for-you.model";
import { ForYouCard } from "@/features/for-you/for-you-card";
import { DashboardResourceStatus } from "./dashboard-resource-status";

/** A preview of the same pending reviews and priority order as For you. */
export function BriefNeeds({
	topicId,
	compact = false,
}: {
	topicId?: string;
	compact?: boolean;
}) {
	const queue = useForYou();
	const items = selectForYouItems(queue.items, { topicId });
	const href = topicId
		? `/for-you?${new URLSearchParams({ topic: topicId })}`
		: "/for-you";
	return (
		<section aria-label="For you" className="min-w-0">
			<header
				className={cn(
					"mb-4 flex min-h-12 items-center justify-between gap-2 border-b px-1 pb-3",
					compact && "min-h-0 border-0 pb-0",
				)}
			>
				<H2 className="font-medium text-base">For you</H2>
				<Button
					asChild
					variant="link"
					size="sm"
					className="pointer-coarse:min-h-11 px-0 text-foreground"
				>
					<Link
						to={href}
						aria-label={`See all ${items.length} For you items`}
					>
						See all{items.length > 0 ? ` ${items.length}` : ""}
						<ArrowRight aria-hidden="true" className="size-4" />
					</Link>
				</Button>
			</header>
			<DashboardResourceStatus
				error={queue.errors.join(" ")}
				loading={queue.isLoading && !items.length}
				onRetry={queue.refresh}
			/>
			<div className="@container/reviews space-y-3">
				{items.slice(0, compact ? 4 : 8).map((item) => (
					<ForYouCard key={item.id} item={item} view="list" />
				))}
			</div>
			{!items.length && !queue.isLoading && !queue.errors.length && (
				<div className="space-y-3 rounded-xl border bg-card p-6">
					<CheckCheck
						aria-hidden="true"
						className="size-6 text-muted-foreground"
					/>
					<P className="text-sm">
						{!queue.isComplete
							? "Nothing found yet. Some sources are still being checked."
							: topicId
								? "Nothing to review in this topic."
								: "You're all caught up. Nothing to review right now."}
					</P>
				</div>
			)}
		</section>
	);
}
