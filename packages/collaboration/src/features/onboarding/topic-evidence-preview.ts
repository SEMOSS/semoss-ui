import type { TopicEvidenceItem } from "./topic-evidence-api";
import type { TopicDraft, TopicReview } from "./topic-review-api";

export interface PreviewTopicLink {
	key: string;
	name: string;
	primary: boolean;
}

/** Project only explicit draft choices over current links, using the server's primary-topic semantics. */
export function previewTopicLinks(
	item: TopicEvidenceItem,
	review: TopicReview,
	topics: TopicDraft[],
): PreviewTopicLink[] {
	const links = new Map<string, PreviewTopicLink>();
	for (const link of item.links) {
		const draftTopic = review.draft.topics.find(
			(topic) => topic.id === link.topicId,
		);
		const key = draftTopic?.key ?? `saved-${link.topicId}`;
		links.set(key, {
			key,
			name: topics.find((topic) => topic.key === key)?.name || link.name,
			primary: link.primary,
		});
	}
	const corrections = (review.draft.corrections ?? []).filter(
		(correction) => correction.threadId === item.id,
	);
	for (const correction of corrections) {
		if (correction.state === "exclude") links.delete(correction.topicKey);
	}
	if (![...links.values()].some((link) => link.primary)) {
		const first = links.values().next().value;
		if (first) links.set(first.key, { ...first, primary: true });
	}
	for (const primary of [false, true]) {
		for (const correction of corrections) {
			if (
				correction.state !== "include" ||
				correction.primary !== primary
			)
				continue;
			const existing = links.get(correction.topicKey);
			const makePrimary =
				primary || links.size === 0 || existing?.primary === true;
			if (primary)
				for (const [key, link] of links)
					links.set(key, { ...link, primary: false });
			links.set(correction.topicKey, {
				key: correction.topicKey,
				name:
					topics.find((topic) => topic.key === correction.topicKey)
						?.name || "New topic",
				primary: makePrimary,
			});
		}
	}
	return [...links.values()];
}
