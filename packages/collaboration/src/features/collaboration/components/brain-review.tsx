import { lazy, Suspense } from "react";
import { useWorkUpdates } from "../live/work-updates.context";
import { SampleBrainReview } from "./sample-brain-review";

const LiveBrainReview = lazy(() =>
	import("@/features/brain-review/brain-review-workspace").then((module) => ({
		default: module.BrainReviewWorkspace,
	})),
);

/** Connected accounts use durable Review APIs; isolated fixtures require no backend. */
export function BrainReview() {
	const updates = useWorkUpdates();
	return updates ? (
		<Suspense
			fallback={
				<output className="p-6 text-muted-foreground">
					Loading Review…
				</output>
			}
		>
			<LiveBrainReview />
		</Suspense>
	) : (
		<SampleBrainReview />
	);
}
