import type { InsightActions } from "@/lib/pixel";
import { optimizePrompt } from "./optimize-prompt";

function actionsReturning(output: unknown) {
	return {
		run: vi.fn(async () => ({
			pixelReturn: [{ output, operationType: [] }],
		})),
	} as unknown as InsightActions;
}

describe("optimizePrompt", () => {
	it("uses the selected model and room instructions", async () => {
		const actions = actionsReturning({ response: "A clearer prompt" });

		await expect(
			optimizePrompt(actions, {
				modelId: "model-1",
				draft: "rough prompt",
				instructions: "Be concise",
			}),
		).resolves.toBe("A clearer prompt");
		expect(actions.run).toHaveBeenCalledWith(
			expect.stringContaining('engine=["model-1"]'),
		);
		expect(actions.run).toHaveBeenCalledWith(
			expect.stringContaining('context=["Be concise"]'),
		);
	});

	it("requires a model and validates the LLM response", async () => {
		await expect(
			optimizePrompt(actionsReturning({ response: "unused" }), {
				modelId: "",
				draft: "rough prompt",
				instructions: "",
			}),
		).rejects.toThrow("Choose a model before optimizing a prompt.");

		await expect(
			optimizePrompt(actionsReturning({ response: "" }), {
				modelId: "model-1",
				draft: "rough prompt",
				instructions: "",
			}),
		).rejects.toThrow("SEMOSS returned an unexpected shape");
	});
});
