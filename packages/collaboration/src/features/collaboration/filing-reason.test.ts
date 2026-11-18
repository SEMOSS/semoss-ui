import { describe, expect, it } from "vitest";
import {
	filingReason,
	headlineLink,
	parseCandidateSignals,
	parseFilingSignals,
} from "./filing-reason";
import type {
	FilingSignals,
	ThreadTopicLink,
} from "./state/collaboration.types";

const signals = (overrides: Partial<FilingSignals> = {}): FilingSignals => ({
	keywordMatches: [],
	matchedSenderIds: [],
	baseConfidence: 70,
	finalConfidence: 70,
	topicVipApplied: false,
	topicVipPoints: 0,
	...overrides,
});
const names: Record<string, string> = { p1: "Tomas Krupa", p2: "Dana Lee" };
const name = (id: string) => names[id];

const stored = {
	version: 1,
	keywordMatches: [
		{ keyword: "budget", field: "subject" },
		{ keyword: "deck", field: "body", messageIndex: 0 },
		{ field: "body" },
	],
	matchedSenderIds: ["p1", 7],
	baseConfidence: 72,
	finalConfidence: 82,
	topicVipApplied: true,
	topicVipPoints: 10,
};

describe("parseFilingSignals", () => {
	it("reads the stored shape and drops malformed entries", () => {
		expect(parseFilingSignals(stored)).toEqual({
			keywordMatches: [
				{ keyword: "budget", field: "subject" },
				{ keyword: "deck", field: "body" },
			],
			matchedSenderIds: ["p1"],
			baseConfidence: 72,
			finalConfidence: 82,
			topicVipApplied: true,
			topicVipPoints: 10,
		});
	});

	it.each([
		["null", null],
		["a string", "x"],
		["an array", []],
		["the legacy shape", { topics: { t1: 0.9 }, fyi: 0, raw: {} }],
	])("returns undefined for %s", (_label, value) => {
		expect(parseFilingSignals(value)).toBeUndefined();
	});

	it("defaults missing numbers and lists", () => {
		expect(parseFilingSignals({ keywordMatches: [] })).toEqual({
			keywordMatches: [],
			matchedSenderIds: [],
			baseConfidence: null,
			finalConfidence: null,
			topicVipApplied: false,
			topicVipPoints: 0,
		});
	});
});

describe("parseCandidateSignals", () => {
	it("keeps topics with signals only", () => {
		const parsed = parseCandidateSignals({
			t1: stored,
			t2: null,
			t3: { x: 1 },
		});
		expect(Object.keys(parsed ?? {})).toEqual(["t1"]);
	});

	it("is undefined when none carry signals", () => {
		expect(parseCandidateSignals({ t1: null })).toBeUndefined();
		expect(parseCandidateSignals(undefined)).toBeUndefined();
	});
});

describe("headlineLink", () => {
	const link = (
		topicId: string,
		source: ThreadTopicLink["source"],
		confidence: number | null,
		primary = false,
	): ThreadTopicLink => ({ topicId, source, confidence, primary });

	it("prefers a filed primary link", () => {
		expect(
			headlineLink([
				link("a", "suggested", 90),
				link("b", "confirmed", 60, true),
			])?.topicId,
		).toBe("b");
	});

	it("takes the likeliest suggestion, not a leftover primary flag", () => {
		expect(
			headlineLink([
				link("weak", "suggested", 27, true),
				link("strong", "suggested", 71),
			])?.topicId,
		).toBe("strong");
	});

	it("has none without links and copes with missing confidence", () => {
		expect(headlineLink([])).toBeUndefined();
		expect(
			headlineLink([
				link("a", "suggested", null),
				link("b", "suggested", 5),
			])?.topicId,
		).toBe("b");
	});
});

describe("filingReason", () => {
	it("says so when the owner filed the thread", () => {
		expect(filingReason({ source: "you" }, name)).toEqual({
			reasons: ["You filed this thread here."],
			confidence: null,
		});
	});

	it("gives nothing when Brain kept no evidence", () => {
		expect(filingReason({ source: "confirmed" }, name)).toEqual({
			reasons: [],
			confidence: null,
		});
	});

	it("names keywords by where they were found, and the confidence", () => {
		const result = filingReason(
			{
				source: "suggested",
				signals: signals({
					finalConfidence: 82,
					keywordMatches: [
						{ keyword: "rate limit", field: "subject" },
						{ keyword: "sprint", field: "body" },
					],
				}),
			},
			name,
		);
		expect(result.confidence).toBe(82);
		expect(result.reasons).toEqual([
			'The subject has the topic keyword "rate limit".',
			'The mail has the topic keyword "sprint".',
		]);
	});

	it("lists known senders once and skips people it cannot name", () => {
		const { reasons } = filingReason(
			{
				source: "suggested",
				signals: signals({
					matchedSenderIds: ["p1", "p1", "p2", "gone"],
				}),
			},
			name,
		);
		expect(reasons).toEqual([
			"Sent by Tomas Krupa, Dana Lee, who work on this topic.",
		]);
	});

	it("agrees the verb with a single sender", () => {
		const { reasons } = filingReason(
			{
				source: "suggested",
				signals: signals({ matchedSenderIds: ["p1"] }),
			},
			name,
		);
		expect(reasons).toEqual([
			"Sent by Tomas Krupa, who works on this topic.",
		]);
	});

	it("shortens long keyword lists", () => {
		const { reasons } = filingReason(
			{
				source: "suggested",
				signals: signals({
					keywordMatches: ["a", "b", "c", "d", "e"].map(
						(keyword) => ({
							keyword,
							field: "body" as const,
						}),
					),
				}),
			},
			name,
		);
		expect(reasons[0]).toBe(
			'The mail has the topic keyword "a", "b", "c" and 2 more.',
		);
	});

	it("reports the topic VIP boost", () => {
		const { reasons } = filingReason(
			{
				source: "confirmed",
				signals: signals({
					topicVipApplied: true,
					topicVipPoints: 10,
					finalConfidence: 90,
				}),
			},
			name,
		);
		expect(reasons).toEqual([
			"Sent by a VIP for this topic (+10 confidence).",
		]);
	});

	it("falls back to the description when nothing specific matched", () => {
		expect(
			filingReason({ source: "suggested", signals: signals() }, name)
				.reasons,
		).toEqual(["The conversation fits this topic's description."]);
	});
});
