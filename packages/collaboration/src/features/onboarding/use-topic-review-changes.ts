import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { message } from "./onboarding-ui";
import {
	changeTopicReview,
	type TopicReviewChange,
} from "./topic-evidence-api";
import {
	getTopicReview,
	reviewDraft,
	setTopicArea,
	type TopicReview,
	type TopicReviewDraft,
} from "./topic-review-api";
import type { useTopicReviewDraft } from "./use-topic-review-draft";

interface PendingChange {
	id: string;
	change:
		| TopicReviewChange
		| { type: "area"; area: string; split: boolean }
		| { type: "draft"; draft: TopicReviewDraft; revision: number };
	baseRevision?: number;
}

interface TopicReviewChanges {
	isChanging: boolean;
	error: string | null;
	/** Flush profile edits, perform one reversible operation, and reconcile the shared form. */
	change: (change: TopicReviewChange) => Promise<TopicReview | null>;
	setArea: (area: string, split: boolean) => Promise<TopicReview | null>;
	saveDraft: (
		draft: TopicReviewDraft,
		revision: number,
	) => Promise<TopicReview | null>;
	/** Reuse the original ID after a rejected or uncertain response. */
	retry: () => void;
	/** Clear a failed operation only after explicitly reloading the authoritative draft. */
	reset: () => void;
}

/** Serialize direct and assistant changes with autosave; stale owner/closed-step callbacks cannot write. */
export function useTopicReviewChanges(
	actions: InsightActions,
	controller: ReturnType<typeof useTopicReviewDraft>,
	form: Pick<UseFormReturn<TopicReviewDraft>, "getValues" | "reset">,
): TopicReviewChanges {
	const [isChanging, setIsChanging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const active = useRef(false);
	const scope = useRef({ actions, reviewId: controller.review.id });
	scope.current = { actions, reviewId: controller.review.id };
	const inFlight = useRef<Promise<TopicReview | null> | null>(null);
	const failed = useRef<PendingChange | null>(null);
	const reviewId = controller.review.id;
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
		};
	}, []);

	const isCurrent = (): boolean =>
		active.current &&
		scope.current.actions === actions &&
		scope.current.reviewId === reviewId;
	const perform = (pending: PendingChange): Promise<TopicReview | null> => {
		if (!isCurrent()) return Promise.resolve(null);
		if (inFlight.current) return inFlight.current;
		setIsChanging(true);
		setError(null);
		const request = (async (): Promise<TopicReview | null> => {
			try {
				if (
					failed.current?.id === pending.id &&
					pending.baseRevision !== undefined &&
					(pending.change.type === "area" ||
						pending.change.type === "draft")
				) {
					const recovered = await getTopicReview(actions);
					if (!isCurrent()) return null;
					if (!recovered || recovered.id !== reviewId)
						throw new Error("The saved review is unavailable.");
					const operation = pending.change;
					const matches =
						operation.type === "area"
							? recovered.draft.areas?.find(
									(area) => area.key === operation.area,
								)?.split === operation.split
							: JSON.stringify(
									reviewDraft(recovered).topics.map(
										(topic) => ({
											...topic,
											addedPeople:
												topic.addedPeople ?? [],
										}),
									),
								) ===
									JSON.stringify(
										operation.draft.topics.map((topic) => ({
											...topic,
											addedPeople:
												topic.addedPeople ?? [],
										})),
									) &&
								recovered.draft.guidance ===
									operation.draft.guidance &&
								recovered.draft.granularity ===
									operation.draft.granularity;
					if (
						recovered.revision === pending.baseRevision + 1 &&
						matches
					) {
						controller.acceptReview(recovered);
						form.reset(reviewDraft(recovered));
						failed.current = null;
						return recovered;
					}
					if (recovered.revision !== pending.baseRevision)
						throw new Error(
							"The review changed elsewhere. Reload the saved review before continuing.",
						);
				}
				// A structural operation may have committed while its response was lost.
				// Recover it before autosave can resubmit the older, uncombined form.
				if (
					failed.current?.id === pending.id &&
					["organize", "reconcile_profile", "undo"].includes(
						pending.change.type,
					)
				) {
					const recovered = await getTopicReview(actions);
					if (!isCurrent()) return null;
					if (
						recovered?.id === reviewId &&
						(recovered.draft.operationIds ?? []).includes(
							pending.id,
						)
					) {
						controller.acceptReview(recovered);
						form.reset(reviewDraft(recovered));
						failed.current = null;
						return recovered;
					}
				}
				const saved =
					pending.change.type === "draft" &&
					failed.current?.id === pending.id
						? controller.review
						: await controller.flushDraft(form.getValues());
				if (!isCurrent()) return null;
				pending.baseRevision = saved.revision;
				let changed: TopicReview;
				if (pending.change.type === "area") {
					changed = await setTopicArea(
						actions,
						saved,
						pending.change.area,
						pending.change.split,
					);
				} else if (pending.change.type === "draft") {
					if (saved.revision !== pending.change.revision)
						throw new Error(
							"Your topics changed since this proposal. Ask again with the updated draft.",
						);
					changed = await controller.flushDraft(pending.change.draft);
				} else {
					changed = await changeTopicReview(
						actions,
						saved,
						pending.id,
						pending.change,
					);
				}
				if (!isCurrent()) return null;
				controller.acceptReview(changed);
				if (
					JSON.stringify(form.getValues()) !==
					JSON.stringify(reviewDraft(changed))
				)
					form.reset(reviewDraft(changed));
				failed.current = null;
				return changed;
			} catch (cause: unknown) {
				if (isCurrent()) {
					failed.current = pending;
					setError(message(cause));
				}
				return null;
			} finally {
				if (isCurrent()) setIsChanging(false);
			}
		})().finally(() => {
			if (inFlight.current === request) inFlight.current = null;
		});
		inFlight.current = request;
		return request;
	};

	return {
		isChanging,
		error,
		change: (change) => {
			if (failed.current) return Promise.resolve(null);
			return perform({ id: crypto.randomUUID(), change });
		},
		setArea: (area, split) => {
			if (failed.current) return Promise.resolve(null);
			return perform({
				id: crypto.randomUUID(),
				change: { type: "area", area, split },
			});
		},
		saveDraft: (draft, revision) => {
			if (failed.current) return Promise.resolve(null);
			return perform({
				id: crypto.randomUUID(),
				change: { type: "draft", draft, revision },
			});
		},
		retry: () => {
			if (failed.current) void perform(failed.current);
		},
		reset: () => {
			failed.current = null;
			setError(null);
		},
	};
}
