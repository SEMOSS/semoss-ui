import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { z } from "@semoss/ui/next";

const engineSchema = z.object({
	engine_id: z.string(),
	engine_name: z.string(),
	engine_display_name: z.string().nullish(),
	engine_type: z.literal("MODEL"),
	engine_subtype: z.string().nullish(),
	description: z.string().nullish(),
});

const engineListSchema = z.array(engineSchema);

/** Resolve a persisted model id to the display metadata used by EngineSelect. */
export function useRoomModel(modelId: string): {
	engine: Engine | null;
	isLoading: boolean;
	error: Error | null;
} {
	const statement = modelId
		? `META | MyEngines(engine=${JSON.stringify([modelId])}, engineTypes=["MODEL"], limit=[1], offset=[0]);`
		: "";
	const query = usePixel<unknown>(statement);
	const parsed = engineListSchema.safeParse(query.data);
	const entry = parsed.success ? parsed.data[0] : undefined;
	const engine: Engine | null = entry
		? {
				...entry,
				engine_display_name: entry.engine_display_name ?? undefined,
				engine_subtype: entry.engine_subtype ?? undefined,
				description: entry.description ?? undefined,
			}
		: null;
	const isLoading =
		Boolean(modelId) &&
		(query.status === "INITIAL" || query.status === "LOADING");
	const validationError =
		modelId && query.status === "SUCCESS" && !parsed.success
			? new Error("The saved model returned an unexpected response.")
			: null;

	return {
		engine,
		isLoading,
		error: query.error ?? validationError,
	};
}
