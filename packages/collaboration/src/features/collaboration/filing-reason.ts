import type {
	FilingSignals,
	KeywordMatch,
	ThreadTopicLink,
} from "./state/collaboration.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number | null =>
	typeof value === "number" && Number.isFinite(value) ? value : null;

function parseKeywordMatch(value: unknown): KeywordMatch[] {
	if (!isRecord(value) || typeof value.keyword !== "string" || !value.keyword)
		return [];
	return [
		{
			keyword: value.keyword,
			field: value.field === "subject" ? "subject" : "body",
		},
	];
}

/**
 * Reads the signals Brain stores on a topic link. Returns undefined for null,
 * malformed, or legacy payloads (no `keywordMatches`), so callers show nothing
 * rather than guess a reason.
 */
export function parseFilingSignals(value: unknown): FilingSignals | undefined {
	if (!isRecord(value) || !Array.isArray(value.keywordMatches))
		return undefined;
	return {
		keywordMatches: value.keywordMatches.flatMap(parseKeywordMatch),
		matchedSenderIds: Array.isArray(value.matchedSenderIds)
			? value.matchedSenderIds.filter(
					(id): id is string => typeof id === "string",
				)
			: [],
		baseConfidence: toNumber(value.baseConfidence),
		finalConfidence: toNumber(value.finalConfidence),
		topicVipApplied: value.topicVipApplied === true,
		topicVipPoints: toNumber(value.topicVipPoints) ?? 0,
	};
}

/** Parses a map of topic id to signals, dropping entries that carry none. */
export function parseCandidateSignals(
	value: unknown,
): Record<string, FilingSignals> | undefined {
	if (!isRecord(value)) return undefined;
	const entries = Object.entries(value).flatMap(([topicId, signals]) => {
		const parsed = parseFilingSignals(signals);
		return parsed ? [[topicId, parsed] as const] : [];
	});
	return entries.length ? Object.fromEntries(entries) : undefined;
}

/** What the owner sees about why a thread was filed under a topic. */
export interface FilingReason {
	/** Short plain-language reasons, most telling first; empty when there is nothing honest to say. */
	reasons: string[];
	/** The confidence (0-100) the filing decision ended with; null when Brain kept no evidence. */
	confidence: number | null;
}

const MAX_LISTED = 3;

/**
 * The link the thread header explains: the primary link once it is filed, else
 * the likeliest suggestion. A suggested link's primary flag is only left over
 * from an earlier sort, so it must not outrank a more confident suggestion.
 */
export function headlineLink(
	links: ThreadTopicLink[],
): ThreadTopicLink | undefined {
	const filed = links.find(
		(link) => link.primary && link.source !== "suggested",
	);
	if (filed) return filed;
	return links.reduce<ThreadTopicLink | undefined>(
		(best, link) =>
			!best || (link.confidence ?? -1) > (best.confidence ?? -1)
				? link
				: best,
		undefined,
	);
}

const quoted = (words: string[]): string => {
	const shown = words.slice(0, MAX_LISTED).map((word) => `"${word}"`);
	const more = words.length - shown.length;
	return more > 0 ? `${shown.join(", ")} and ${more} more` : shown.join(", ");
};

/**
 * Turns the evidence Brain stored on a topic link into reasons for the owner.
 * An owner-made link says so; a link without evidence (older, or never scored)
 * yields no reasons rather than a guess.
 *
 * @param link - The link, or a review candidate shaped like one.
 * @param personName - Resolves a person id to a name; unknown people are left out.
 */
export function filingReason(
	link: Pick<ThreadTopicLink, "source" | "signals">,
	personName: (personId: string) => string | undefined,
): FilingReason {
	if (link.source === "you")
		return { reasons: ["You filed this thread here."], confidence: null };
	const { signals } = link;
	if (!signals) return { reasons: [], confidence: null };

	const reasons: string[] = [];
	const inSubject = signals.keywordMatches
		.filter((match) => match.field === "subject")
		.map((match) => match.keyword);
	const inBody = signals.keywordMatches
		.filter((match) => match.field === "body")
		.map((match) => match.keyword);
	if (inSubject.length)
		reasons.push(`The subject has the topic keyword ${quoted(inSubject)}.`);
	if (inBody.length)
		reasons.push(`The mail has the topic keyword ${quoted(inBody)}.`);

	const senders = [
		...new Set(
			signals.matchedSenderIds.flatMap((id) => personName(id) ?? []),
		),
	];
	if (senders.length)
		reasons.push(
			`Sent by ${senders.slice(0, MAX_LISTED).join(", ")}${senders.length > MAX_LISTED ? ` and ${senders.length - MAX_LISTED} more` : ""}, who ${senders.length === 1 ? "works" : "work"} on this topic.`,
		);
	if (signals.topicVipApplied && signals.topicVipPoints > 0)
		reasons.push(
			`Sent by a VIP for this topic (+${signals.topicVipPoints} confidence).`,
		);
	// the topic's description steers the model even when no keyword or person matched
	if (!reasons.length)
		reasons.push("The conversation fits this topic's description.");
	return { reasons, confidence: signals.finalConfidence };
}
