import { z } from "@semoss/ui/next";

const summarySchema = z.object({
	messages: z.array(z.unknown()),
	participants: z.array(z.object({ included: z.boolean() })),
	topics: z.array(z.unknown()),
	hiddenCount: z.number().optional(),
});
/** Read counts from a submitted snapshot without exposing its raw envelope in normal UI. */
export function workContextSummary(text: string): string {
	try {
		const parsed = summarySchema.safeParse(JSON.parse(text));
		if (!parsed.success) return "Saved source context";
		const data = parsed.data;
		return `${data.messages.length} messages · ${data.participants.filter((person) => person.included).length} people · ${data.topics.length} topics${data.hiddenCount ? ` · ${data.hiddenCount} excluded messages` : ""}`;
	} catch {
		return "Saved source context";
	}
}
