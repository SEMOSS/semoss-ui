import { z } from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";

const fileSchema = z.object({
	path: z.string().optional(),
	filePath: z.string().optional(),
	name: z.string().optional(),
});
const outputSchema = fileSchema.extend({
	files: z.array(fileSchema).optional(),
	artifacts: z.array(fileSchema).optional(),
	workflow: z.string().optional(),
	artifact: z.unknown().optional(),
});
const availableDeckSchema = z.object({
	filePath: z.string().min(1),
	status: z.literal("available"),
	structuralValidation: z.literal("passed"),
	sourceHash: z.string().min(1),
});

/** Accept only presentation paths relative to the current room's file folder. */
export function presentationPath(value: string): string | null {
	const path = value.trim();
	if (
		!path.toLowerCase().endsWith(".pptx") ||
		/[\\:%?#\p{Cc}]/u.test(path) ||
		path
			.split("/")
			.some((segment) => !segment || segment === "." || segment === "..")
	)
		return null;
	return path;
}

/** Only explicit file results in the current room become file actions. */
export function presentationFiles(
	tool: ConversationTool,
	roomId?: string,
): { path: string; name: string }[] {
	if (
		tool.status !== "COMPLETED" ||
		!tool.output ||
		(tool.roomId && tool.roomId !== roomId)
	)
		return [];
	try {
		const result = outputSchema.safeParse(JSON.parse(tool.output));
		if (!result.success) return [];
		let rows = [
			result.data,
			...(result.data.files ?? []),
			...(result.data.artifacts ?? []),
		];
		// The existing PPTX workflow reports delivery evidence in its tool result.
		// A completed tool call alone does not mean the generated deck is available.
		if (result.data.workflow === "pptx") {
			const artifact = availableDeckSchema.safeParse(
				result.data.artifact,
			);
			if (!artifact.success) return [];
			rows = [artifact.data];
		}
		return [
			...new Map(
				rows.flatMap((row) => {
					const path = presentationPath(
						row.path || row.filePath || "",
					);
					if (!path) return [];
					return [
						[
							path,
							{
								path,
								name:
									row.name ||
									path.split("/").at(-1) ||
									"Presentation.pptx",
							},
						] as const,
					];
				}),
			).values(),
		];
	} catch {
		return [];
	}
}

/** Recognize presentation capabilities without triggering tools. */
export function isPresentationTool(tool: ConversationTool): boolean {
	return (
		/powerpoint|pptx|presentation/i.test(`${tool.name} ${tool.title}`) ||
		presentationFiles(tool, tool.roomId).length > 0
	);
}
