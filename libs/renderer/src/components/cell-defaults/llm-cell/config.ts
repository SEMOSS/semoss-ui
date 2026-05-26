import type { CellConfig } from "../../../store";
import { LLMCell, type LLMCellDef } from "./llm-cell";

const escapePixelString = (value: string): string => value.replace(/"/g, '\\"');

export const LLMCellConfig: CellConfig<LLMCellDef> = {
	name: "LLM",
	widget: "llm",
	view: LLMCell,
	parameters: {
		command: "",
		models: [],
	},
	toPixel: ({ command, models }) => {
		if (!Array.isArray(models) || models.length === 0) {
			return [];
		}

		const safeCommand = escapePixelString(command ?? "");

		return models.map((model) => {
			let paramFragment = "";
			if (model.params && model.params.trim()) {
				try {
					const parsed = JSON.parse(model.params);
					if (
						parsed &&
						typeof parsed === "object" &&
						Object.keys(parsed).length > 0
					) {
						paramFragment = `, paramValues=[${JSON.stringify(parsed)}]`;
					}
				} catch {
					// Ignore invalid JSON — fall through without paramValues.
				}
			}
			return `LLM(engine=["${model.id}"], command=["${safeCommand}"]${paramFragment});`;
		});
	},
};
