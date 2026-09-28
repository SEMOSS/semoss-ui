import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const optimizedPromptSchema = z.object({
	response: z.string().trim().min(1),
});

/** Improve a composer draft with the room's selected model. */
export async function optimizePrompt(
	actions: InsightActions,
	options: {
		modelId: string;
		draft: string;
		instructions: string;
	},
): Promise<string> {
	if (!options.modelId) {
		throw new Error("Choose a model before optimizing a prompt.");
	}

	const command = [
		"Improve the following prompt so it is clear, specific, and effective while preserving its intent.",
		"Return only the improved prompt with no explanation or formatting.",
		options.draft,
	].join("\n\n");

	const result = await callPixel(
		actions,
		pixel("LLM", {
			engine: options.modelId,
			command,
			context: options.instructions || undefined,
			paramValues: { max_tokens: 10_000 },
		}),
		optimizedPromptSchema,
	);

	return result.response;
}
