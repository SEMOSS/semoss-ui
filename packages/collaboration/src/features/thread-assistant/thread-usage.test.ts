import { threadUsage } from "./thread-usage";

it("uses the last two token-bearing messages on the active branch", () => {
	expect(
		threadUsage([
			{ messageId: "old", tokens: 500 },
			{ messageId: "input", tokens: 100 },
			{ messageId: "tool", parentMessageId: "input", tokens: 0 },
			{ messageId: "answer", parentMessageId: "tool", tokens: 20 },
		]),
	).toEqual({ contextTokens: 120, totalTokens: 620 });
});
it("reports unknown usage and safely ends cyclic parent chains", () => {
	expect(threadUsage([{ messageId: "missing" }])).toEqual({
		contextTokens: null,
		totalTokens: null,
	});
	expect(
		threadUsage([
			{ messageId: "loop", parentMessageId: "loop", tokens: 10 },
		]),
	).toEqual({ contextTokens: 10, totalTokens: 10 });
});
