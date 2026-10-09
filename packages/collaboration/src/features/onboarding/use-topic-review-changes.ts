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
	type TopicReview,
	type TopicReviewDraft,
} from "./topic-review-api";
import type { useTopicReviewDraft } from "./use-topic-review-draft";

interface PendingChange {
	id: string;
	change: TopicReviewChange;
}

interface TopicReviewChanges {
	isChanging: boolean;
	error: string | null;
	/** Flush profile edits, perform one reversible operation, and reconcile the shared form. */
	change: (change: TopicReviewChange) => Promise<TopicReview | null>;
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
				const saved = await controller.flushDraft(form.getValues());
				if (!isCurrent()) return null;
				const changed = await changeTopicReview(
					actions,
					saved,
					pending.id,
					pending.change,
				);
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
		retry: () => {
			if (failed.current) void perform(failed.current);
		},
		reset: () => {
			failed.current = null;
			setError(null);
		},
	};
}
