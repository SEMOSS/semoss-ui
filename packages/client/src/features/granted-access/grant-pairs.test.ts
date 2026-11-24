import { describe, expect, it } from "vitest";
import type { ModelUsageLimit } from "@semoss/sdk";
import type { PickedResource } from "@/features/grants/picked-resource";
import { findRefusedPairs, toGrantBatches } from "./grant-pairs";

/** 5,000 tokens a day shared */
const LIMIT: ModelUsageLimit = {
	unlimited: false,
	rules: [
		{ metric: "TOKENS", amount: 5000, window: "DAY", counts: "SHARED" },
	],
};

const SKILL: PickedResource = {
	resourceType: "PROJECT",
	id: "skill1",
	type: "PROJECT",
	subtype: "SKILL",
	name: "Orders Skill",
};
const MODEL: PickedResource = {
	resourceType: "ENGINE",
	id: "model1",
	type: "MODEL",
	subtype: "OPEN_AI",
	name: "Orders Model",
};
const AGENT: PickedResource = {
	resourceType: "PROJECT",
	id: "agent1",
	type: "PROJECT",
	subtype: "WORKSPACE",
	name: "Orders Agent",
};
const VECTORS: PickedResource = {
	resourceType: "ENGINE",
	id: "vectors1",
	type: "VECTOR",
	subtype: "FAISS",
	name: "Orders Vectors",
};

describe("toGrantBatches", () => {
	it("gives every grantee the level on every target, one batch for each target, with the limit only on a model", () => {
		const { batches, leftOut } = toGrantBatches(
			[SKILL, MODEL],
			[AGENT, VECTORS],
			"READ_ONLY",
			LIMIT,
		);

		expect(batches).toEqual([
			{
				target: { resourceType: "PROJECT", id: "skill1" },
				changes: [
					{
						action: "ADD",
						subject: {
							category: "ENGINE",
							id: "agent1",
							type: "PROJECT",
						},
						to: { level: "READ_ONLY", endDate: null },
					},
				],
			},
			{
				target: { resourceType: "ENGINE", id: "model1" },
				changes: [
					{
						action: "ADD",
						subject: {
							category: "ENGINE",
							id: "agent1",
							type: "PROJECT",
						},
						to: {
							level: "READ_ONLY",
							endDate: null,
							usageLimit: LIMIT,
						},
					},
					{
						action: "ADD",
						subject: {
							category: "ENGINE",
							id: "vectors1",
							type: "VECTOR",
						},
						to: {
							level: "READ_ONLY",
							endDate: null,
							usageLimit: LIMIT,
						},
					},
				],
			},
		]);
		expect(leftOut).toEqual([
			{
				target: SKILL,
				grantee: VECTORS,
				reason: "Engines are given access on engines only",
			},
		]);
	});

	it("leaves out a target paired with itself, and a target with nothing left", () => {
		const { batches, leftOut } = toGrantBatches(
			[AGENT],
			[AGENT],
			"EDIT",
			null,
		);

		expect(batches).toEqual([]);
		expect(leftOut).toEqual([
			{
				target: AGENT,
				grantee: AGENT,
				reason: "Nothing is given a permission on itself",
			},
		]);
	});
});

describe("findRefusedPairs", () => {
	it("names each refused change by its target and grantee, and every change of a batch refused as a whole", () => {
		const { batches } = toGrantBatches(
			[SKILL, MODEL],
			[AGENT],
			"READ_ONLY",
			null,
		);

		expect(
			findRefusedPairs(
				batches,
				[
					{
						target: batches[0].target,
						reason: null,
						changes: [
							{
								index: 0,
								allowed: false,
								reason: "Orders Agent already has access",
							},
						],
					},
					{
						target: batches[1].target,
						reason: "Only this engine's owners can change it",
						changes: [{ index: 0, allowed: false, reason: null }],
					},
				],
				[SKILL, MODEL],
				[AGENT],
			),
		).toEqual([
			{
				targetName: "Orders Skill",
				granteeName: "Orders Agent",
				reason: "Orders Agent already has access",
			},
			{
				targetName: "Orders Model",
				granteeName: "Orders Agent",
				reason: "Only this engine's owners can change it",
			},
		]);
	});

	it("finds nothing when every change can be made", () => {
		const { batches } = toGrantBatches([MODEL], [AGENT], "EDIT", null);

		expect(
			findRefusedPairs(
				batches,
				[
					{
						target: batches[0].target,
						reason: null,
						changes: [{ index: 0, allowed: true, reason: null }],
					},
				],
				[MODEL],
				[AGENT],
			),
		).toEqual([]);
	});
});
