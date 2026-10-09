import { Button, P } from "@semoss/ui/next";
import type { TopicStage } from "./topic-flow";
import { DOT, topicPeople } from "./topic-flow-utils";
import { TopicProfileConflicts } from "./topic-profile-conflicts";
import type { TopicReview, TopicReviewDraft } from "./topic-review-api";
import type { useTopicReviewChanges } from "./use-topic-review-changes";

interface TopicDoneStageProps {
	review: TopicReview;
	values: TopicReviewDraft;
	/** Kept topics, in the order the owner saw them. */
	keys: string[];
	isBusy: boolean;
	changes: ReturnType<typeof useTopicReviewChanges>;
	onEdit: (stage: TopicStage) => void;
}

/** What will be saved, one line per topic. */
export function TopicDoneStage({
	review,
	values,
	keys,
	isBusy,
	changes,
	onEdit,
}: TopicDoneStageProps) {
	const corrections = review.draft.corrections ?? [];
	return (
		<div className="flex flex-col gap-3">
			{review.profileConflicts.length > 0 && (
				<TopicProfileConflicts
					conflicts={review.profileConflicts}
					topics={values.topics}
					isBusy={isBusy || !!changes.error}
					onChoose={(conflict, choice) =>
						void changes.change({
							type: "reconcile_profile",
							topicKey: conflict.topicKey,
							profileVersion: conflict.profileVersion,
							choice,
						})
					}
				/>
			)}
			{keys.length === 0 ? (
				<P className="rounded-lg border p-4 text-muted-foreground text-sm">
					No topics are kept. You can add topics later from Brain.
				</P>
			) : (
				<ul className="divide-y rounded-lg border">
					{keys.map((key) => {
						const value = values.topics.find(
							(topic) => topic.key === key,
						);
						if (!value) return null;
						const evidence = review.draft.topics.find(
							(topic) => topic.key === key,
						);
						const { suggested, added } = topicPeople(
							evidence,
							value,
							{},
						);
						const people =
							suggested.filter((person) => !person.removed)
								.length + added.length;
						const left = corrections.filter(
							(row) =>
								row.topicKey === key && row.state === "exclude",
						).length;
						return (
							<li
								key={key}
								className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2.5"
							>
								<P className="font-medium text-sm">
									{value.name || "New topic"}
								</P>
								<P className="text-muted-foreground text-xs">
									{[
										`${people} ${people === 1 ? "person" : "people"}`,
										`${evidence?.threadIds.length ?? 0} conversations`,
										left ? `${left} taken off` : "",
									]
										.filter(Boolean)
										.join(` ${DOT} `)}
								</P>
							</li>
						);
					})}
				</ul>
			)}
			<div className="flex flex-wrap gap-x-3 text-sm">
				<span className="text-muted-foreground">Change something:</span>
				{(["areas", "people", "conversations"] as const).map(
					(stage) => (
						<Button
							key={stage}
							type="button"
							variant="link"
							className="h-auto p-0"
							disabled={isBusy}
							onClick={() => onEdit(stage)}
						>
							{stage === "areas"
								? "Topics"
								: stage === "people"
									? "People"
									: "Conversations"}
						</Button>
					),
				)}
			</div>
		</div>
	);
}
