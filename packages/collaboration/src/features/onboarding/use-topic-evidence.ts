import { useEffect, useRef, useState } from "react";
import type { InsightActions } from "@/lib/pixel";
import { message } from "./onboarding-ui";
import { getTopicEvidence, type TopicEvidence } from "./topic-evidence-api";
import type { TopicReview } from "./topic-review-api";

interface TopicEvidenceState {
	page: TopicEvidence | null;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
}

/** Load evidence for the selected saved revision; switching topic/session never shows the previous page. */
export function useTopicEvidence(
	actions: InsightActions,
	review: TopicReview,
	topicKey: string,
	query: string,
	offset: number,
): TopicEvidenceState {
	const [result, setResult] = useState<{
		actions: InsightActions;
		scope: string;
		viewScope: string;
		page: TopicEvidence | null;
		error: string | null;
	} | null>(null);
	const [refreshCount, setRefreshCount] = useState(0);
	const epoch = useRef(0);
	const scope = JSON.stringify([
		review.id,
		review.revision,
		topicKey,
		query,
		offset,
		refreshCount,
	]);
	const viewScope = JSON.stringify([review.id, topicKey, query, offset]);
	const current = useRef({ actions, scope });
	current.current = { actions, scope };
	useEffect(() => {
		const ticket = ++epoch.current;
		void getTopicEvidence(actions, review, topicKey, query, offset).then(
			(page) => {
				if (
					ticket === epoch.current &&
					current.current.actions === actions &&
					current.current.scope === scope
				)
					setResult({ actions, scope, viewScope, page, error: null });
			},
			(cause: unknown) => {
				if (
					ticket === epoch.current &&
					current.current.actions === actions &&
					current.current.scope === scope
				)
					setResult({
						actions,
						scope,
						viewScope,
						page: null,
						error: message(cause),
					});
			},
		);
		return () => {
			epoch.current += 1;
		};
	}, [actions, review, topicKey, query, offset, scope, viewScope]);
	const sameView =
		result?.actions === actions && result.viewScope === viewScope
			? result
			: null;
	const latest = sameView?.scope === scope ? sameView : null;
	return {
		page: sameView?.page ?? null,
		error: latest?.error ?? null,
		isLoading: !latest,
		refresh: () => setRefreshCount((count) => count + 1),
	};
}
