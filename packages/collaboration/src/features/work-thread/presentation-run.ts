import { z } from "@semoss/ui/next";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { readThreadCommand } from "@/features/thread-assistant/thread-context";
import { presentationPath } from "./presentation-tools";

const artifactSchema = z.object({
	filePath: z.string().min(1),
	status: z.literal("available"),
	structuralValidation: z.literal("passed"),
	sourceHash: z.string().min(1),
});

export interface PresentationReference {
	roomId: string;
	path: string;
	name: string;
	runId?: string;
	sourceHash?: string;
}

/** Recognize persisted intent even before the workflow publishes its first progress. */
export function isPresentationRun(run: AgentRun): boolean {
	return Boolean(
		run.progress?.workflow ||
			(run.input &&
				readThreadCommand(run.input)?.context.presentationAgentId),
	);
}

/** Artifact paths from this invocation are relative to its room (no subdir override). */
export function presentationRunFiles(run: AgentRun): PresentationReference[] {
	if (!run.roomId) return [];
	const files = new Map<string, PresentationReference>();
	for (const value of run.artifacts ?? []) {
		const parsed = artifactSchema.safeParse(value);
		if (!parsed.success) continue;
		const path = presentationPath(parsed.data.filePath);
		if (!path) continue;
		files.set(path, {
			roomId: run.roomId,
			runId: run.runId,
			path,
			name: path.split("/").at(-1) || "Presentation.pptx",
			sourceHash: parsed.data.sourceHash,
		});
	}
	return [...files.values()];
}
