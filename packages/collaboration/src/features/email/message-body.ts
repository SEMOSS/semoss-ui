import { z } from "@semoss/ui/next";

/** Original source content is display-only, never part of assistant context. */
export const displayBodySchema = z.object({
	contentType: z.enum(["html", "text"]),
	content: z.string().max(128 * 1024),
	isTruncated: z.boolean().optional(),
	attachments: z.array(z.object({ name: z.string() })).optional(),
});

export type DisplayBody = z.infer<typeof displayBodySchema>;

/** Older or malformed optional display data falls back to the existing text. */
export function readDisplayBody(value: unknown): DisplayBody | undefined {
	const parsed = displayBodySchema.safeParse(value);
	return parsed.success ? parsed.data : undefined;
}
