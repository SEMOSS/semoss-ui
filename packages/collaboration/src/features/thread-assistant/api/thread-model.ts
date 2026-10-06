import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const modelSchema = z.object({
	engine_id: z.string().min(1),
	engine_name: z.string(),
	engine_display_name: z.string().nullish(),
});
export type ThreadModel = z.infer<typeof modelSchema>;

/** Resolve eligible models in preference order, then use the catalog's first result. */
export async function resolveThreadModel(
	actions: InsightActions,
	candidates: string[],
): Promise<ThreadModel | null> {
	const ids = [...new Set(candidates.filter(Boolean))];
	const query = (engine?: string[]) =>
		callPixel(
			actions,
			`META | ${pixel("MyEngines", {
				engine,
				engineTypes: ["MODEL"],
				metaFilters: [{ tag: "text-generation" }],
				limit: engine?.length ?? 1,
				offset: 0,
			})}`,
			z.array(modelSchema),
		);
	if (ids.length) {
		const models = await query(ids);
		for (const id of ids) {
			const model = models.find(
				(candidate) => candidate.engine_id === id,
			);
			if (model) return model;
		}
	}
	return (await query())[0] ?? null;
}
