import { describe, expect, it, vi } from "vitest";
import type { SessionInsightStore } from "@semoss/sdk";
import { TOKEN_TYPE_TEXT } from "./prompt.constants";
import { setBlocksAndOpenUIBuilder } from "./prompt.helpers";
import type { Builder } from "./prompt.types";

describe("setBlocksAndOpenUIBuilder", () => {
	it("sends the generated prompt notebooks as queries", async () => {
		const step = { step: 1, required: false, display: "" };
		const builder: Builder = {
			title: { ...step, value: "Prompt app" },
			model: { ...step, value: "model-id" },
			context: { ...step, value: "Help me" },
			inputs: {
				...step,
				value: [
					{
						index: 0,
						key: "Hello",
						display: "Hello",
						type: TOKEN_TYPE_TEXT,
						isHiddenPhraseInputToken: false,
						linkedInputToken: undefined,
					},
				],
			},
			inputTypes: { ...step, value: {} },
			constraints: { ...step, value: {} },
		};
		let submitted = "";
		const run: SessionInsightStore["run"] = async (pixel) => {
			submitted = pixel;
			throw new Error("stop after capture");
		};

		await expect(
			setBlocksAndOpenUIBuilder(builder, run, vi.fn()),
		).rejects.toThrow("stop after capture");

		const encoded = submitted.match(/<encode>(.*?)<\/encode>/);
		expect(encoded).not.toBeNull();
		const state = JSON.parse(encoded?.[1] ?? "");
		expect(state.queries).toMatchObject({
			"Query Definitions": { id: "Query Definitions" },
			"Prompt Query": { id: "Prompt Query" },
		});
		expect(state).not.toHaveProperty("notebooks");
	});
});
