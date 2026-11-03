import { z } from "@semoss/ui/next";

/** Only the server-held workflow's display fields cross into the preview. */
export const routineFlowSchema = z.object({
	nodes: z.array(
		z.object({
			id: z.string().min(1),
			type: z.string().min(1),
			label: z.string(),
			position: z.object({ x: z.number(), y: z.number() }).optional(),
		}),
	),
	edges: z.array(
		z.object({
			source: z.string().min(1),
			target: z.string().min(1),
			sourcePort: z.string(),
			targetPort: z.string(),
		}),
	),
});
