import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { saveStyleNow } from "./style-api";

function actionsReturning(output: unknown) {
	const run = vi.fn(async () => ({
		pixelReturn: [{ operationType: ["OPERATION"], output }],
	}));
	return { actions: { run } as unknown as InsightActions, run };
}

it("saves only the style and returns what the server now holds", async () => {
	const { actions, run } = actionsReturning({
		style: {
			summary: "Warm",
			source: "you",
			confirmed: true,
			examples: [],
		},
	});
	const saved = await saveStyleNow(actions, {
		summary: "Warm",
		confirmed: true,
	});
	expect(run).toHaveBeenCalledWith(
		'BrainSaveProfile(profile=[{"style":{"summary":"Warm","confirmed":true}}]);',
	);
	expect(saved).toMatchObject({ summary: "Warm", confirmed: true });
});

it("fails when the server does not return the saved style", async () => {
	const { actions } = actionsReturning({ name: "Alex" });
	await expect(saveStyleNow(actions, { summary: "Warm" })).rejects.toThrow(
		"did not confirm",
	);
});
