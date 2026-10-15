import { useCallback, useEffect, useRef, useState } from "react";
import type { InsightActions } from "@/lib/pixel";
import {
	getTopicReview,
	reviewDraft,
	saveTopicReview,
	type TopicReview,
	type TopicReviewDraft,
	topicReviewDraftSchema,
} from "./topic-review-api";

const AUTOSAVE_MS = 500;

interface TopicReviewDraftController {
	review: TopicReview;
	status: "saved" | "pending" | "saving" | "error";
	error: string | null;
	/** Queue the latest complete form values; writes are serialized. */
	queueDraft: (values: TopicReviewDraft) => void;
	/** Finish pending writes, including values changed while a write was in flight. */
	flushDraft: (values?: TopicReviewDraft) => Promise<TopicReview>;
	/** Reconcile IDs and readback after a verified apply or an explicit reload. */
	acceptReview: (review: TopicReview) => void;
	/** Explicit recovery after a conflict; entered values remain until this is chosen. */
	reloadSaved: () => Promise<TopicReview>;
}

/** Autosave the owner's draft without replacing fields when older responses arrive. */
export function useTopicReviewDraft(
	actions: InsightActions,
	initialReview: TopicReview,
): TopicReviewDraftController {
	const [review, setReview] = useState(initialReview);
	const [status, setStatus] =
		useState<TopicReviewDraftController["status"]>("saved");
	const [error, setError] = useState<string | null>(null);
	const current = useRef(initialReview);
	const savedValues = useRef(JSON.stringify(reviewDraft(initialReview)));
	const pending = useRef<TopicReviewDraft | null>(null);
	const inFlight = useRef<Promise<TopicReview> | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const epoch = useRef(0);

	useEffect(() => {
		epoch.current += 1;
		const warnUnsaved = (event: BeforeUnloadEvent): void => {
			if (
				pending.current &&
				JSON.stringify(pending.current) !== savedValues.current
			) {
				event.preventDefault();
				event.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", warnUnsaved);
		return () => {
			epoch.current += 1;
			clearTimeout(timer.current);
			window.removeEventListener("beforeunload", warnUnsaved);
		};
	}, []);

	const flushDraft = useCallback(
		async (values?: TopicReviewDraft): Promise<TopicReview> => {
			clearTimeout(timer.current);
			if (values) pending.current = topicReviewDraftSchema.parse(values);
			if (inFlight.current) return inFlight.current;
			const requestEpoch = epoch.current;
			const perform = async (): Promise<TopicReview> => {
				try {
					setError(null);
					while (
						pending.current &&
						JSON.stringify(pending.current) !== savedValues.current
					) {
						setStatus("saving");
						const sent = pending.current;
						const saved = await saveTopicReview(
							actions,
							current.current,
							sent,
						);
						if (requestEpoch !== epoch.current) {
							throw new Error(
								"The review was closed while its draft was being saved",
							);
						}
						if (
							saved.id !== current.current.id ||
							saved.revision < current.current.revision
						) {
							throw new Error(
								"The draft readback does not match this review. Reload the saved review.",
							);
						}
						current.current = saved;
						savedValues.current = JSON.stringify(
							reviewDraft(saved),
						);
						if (pending.current === sent)
							pending.current = reviewDraft(saved);
						setReview(saved);
					}
					setStatus("saved");
					return current.current;
				} catch (cause: unknown) {
					if (requestEpoch === epoch.current) {
						setStatus("error");
						setError(
							cause instanceof Error
								? cause.message
								: String(cause),
						);
					}
					throw cause;
				}
			};
			const request = perform().finally(() => {
				if (inFlight.current === request) inFlight.current = null;
			});
			inFlight.current = request;
			return request;
		},
		[actions],
	);

	const queueDraft = useCallback(
		(values: TopicReviewDraft): void => {
			const parsed = topicReviewDraftSchema.safeParse(values);
			if (!parsed.success) {
				setStatus("error");
				setError(
					"The draft is not saved yet. Check the topic fields before continuing.",
				);
				return;
			}
			pending.current = parsed.data;
			clearTimeout(timer.current);
			if (
				JSON.stringify(parsed.data) === savedValues.current &&
				!inFlight.current
			) {
				setStatus("saved");
				setError(null);
				return;
			}
			setStatus(inFlight.current ? "saving" : "pending");
			setError(null);
			timer.current = setTimeout(() => {
				void flushDraft().catch(() => undefined);
			}, AUTOSAVE_MS);
		},
		[flushDraft],
	);

	const acceptReview = useCallback((saved: TopicReview): void => {
		clearTimeout(timer.current);
		current.current = saved;
		const values = reviewDraft(saved);
		pending.current = values;
		savedValues.current = JSON.stringify(values);
		setReview(saved);
		setStatus("saved");
		setError(null);
	}, []);

	const reloadSaved = useCallback(async (): Promise<TopicReview> => {
		clearTimeout(timer.current);
		if (inFlight.current) {
			await inFlight.current.catch(() => undefined);
		}
		const saved = await getTopicReview(actions);
		if (!saved) throw new Error("The saved topic review is unavailable");
		acceptReview(saved);
		return saved;
	}, [actions, acceptReview]);

	return {
		review,
		status,
		error,
		queueDraft,
		flushDraft,
		acceptReview,
		reloadSaved,
	};
}
