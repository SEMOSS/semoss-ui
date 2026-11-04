import { describe, expect, test } from "vitest";
import { createGuardrailPipeline } from "./engine-guardrail-settings.constants";
import {
	collectGuardrailHitLimitIssues,
	createGuardrailHitLimit,
	describeGuardrailHitLimit,
	durationFromMinutes,
	guardrailHitLimitChecks,
	guardrailHitLimitsFromResponse,
	guardrailHitLimitsToConfig,
	nextOrderedId,
} from "./guardrail-hit-limit";

describe("guardrail hit limits", () => {
	test("reads a duration in the largest unit it fills evenly", () => {
		expect(durationFromMinutes(1440)).toEqual({
			amount: "1",
			unit: "days",
		});
		expect(durationFromMinutes(120)).toEqual({
			amount: "2",
			unit: "hours",
		});
		expect(durationFromMinutes(90)).toEqual({
			amount: "90",
			unit: "minutes",
		});
	});

	test("reads and writes limits as pipeline.json stores them", () => {
		const stored = [
			{ limitId: "close", checks: ["toxicity"], hits: 3, scope: "ROOM" },
			{
				limitId: "lock",
				checks: ["toxicity", "injection"],
				hits: 5,
				scope: "USER",
				windowMinutes: 1440,
				lockMinutes: 90,
				message: "Paused for now.",
			},
			// not a limit, so left out
			{ checks: ["toxicity"] },
		];

		const limits = guardrailHitLimitsFromResponse(stored);
		expect(limits).toHaveLength(2);
		expect(limits[1]).toMatchObject({
			windowAmount: "1",
			windowUnit: "days",
			lockAmount: "90",
			lockUnit: "minutes",
		});
		expect(guardrailHitLimitsToConfig(limits)).toEqual(stored.slice(0, 2));
	});

	test("finds limits that cannot count", () => {
		const empty = createGuardrailHitLimit();
		const removed = createGuardrailHitLimit(["gone"]);
		const badNumbers = {
			...createGuardrailHitLimit(["toxicity"]),
			hits: "0",
			scope: "USER" as const,
			windowAmount: "1.5",
			lockAmount: "400",
			lockUnit: "days" as const,
		};

		const messages = collectGuardrailHitLimitIssues(
			[empty, removed, badNumbers],
			new Set(["toxicity"]),
		).map((issue) => issue.message);

		expect(messages).toEqual([
			"Hit limit 1 counts no checks. Choose the checks whose hits count.",
			"Hit limit 2 counts a check that was removed. Choose the checks again.",
			"Hit limit 3 needs a whole number of hits, from 1 to 2147483647.",
			"Hit limit 3 needs a whole number for how far back it counts hits, up to a year.",
			"Hit limit 3 needs a whole number for how long the user is locked out, up to a year.",
		]);
	});

	test("lists each check by its guardrail, where it runs and what it does", () => {
		const pipeline = createGuardrailPipeline("askRoom");
		const [check] = pipeline.input;
		if (!check) {
			throw Error("A new rule starts with a request check");
		}
		check.guardrailEngineId = "pii-1";
		check.failureAction = "mask";
		const unnamed = createGuardrailPipeline("*");

		expect(
			guardrailHitLimitChecks([pipeline, unnamed], (id) =>
				id === "pii-1" ? "PII" : undefined,
			).map(({ name, detail }) => ({ name, detail })),
		).toEqual([
			{ name: "PII", detail: "askRoom request, masks" },
			{
				name: "No guardrail engine selected",
				detail: "every call request, blocks",
			},
		]);
	});

	test("says what a limit does in one sentence", () => {
		const room = createGuardrailHitLimit(["toxicity"]);
		expect(describeGuardrailHitLimit({ ...room, hits: "1" })).toBe(
			"Closes the room on its first hit.",
		);
		expect(describeGuardrailHitLimit(room)).toBe(
			"Closes the room once it reaches 3 hits.",
		);

		const user = { ...room, scope: "USER" as const };
		expect(describeGuardrailHitLimit(user)).toBe(
			"Locks the user out for 1 hour once they reach 3 hits within 1 day.",
		);
		expect(
			describeGuardrailHitLimit({
				...user,
				hits: "1",
				windowAmount: "2",
				lockAmount: "30",
				lockUnit: "minutes",
			}),
		).toBe(
			"Locks the user out for 30 minutes once they reach 1 hit within 2 days.",
		);
		// nothing to say until the numbers are valid
		expect(
			describeGuardrailHitLimit({ ...user, lockAmount: "" }),
		).toBeNull();
	});

	test("numbers ids in order, after the highest one used", () => {
		expect(nextOrderedId("limit", [])).toBe("limit0");
		// a removed id in the middle is never handed out again
		expect(nextOrderedId("limit", ["limit0", "limit2", "other7"])).toBe(
			"limit3",
		);
		const first = createGuardrailHitLimit();
		expect(first.limitId).toBe("limit0");
		expect(createGuardrailHitLimit([], [first]).limitId).toBe("limit1");
	});
});
