import { z } from "@semoss/ui/next";
import { projectListSchema } from "@/features/agents/api/agent-schemas";
import { agentListPixel } from "@/features/agents/api/list-agents";
import { type AgentRun, readRun } from "@/features/rooms/api/agent-run-api";
import { getThreadAgent } from "@/features/thread-assistant/thread-context";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const activitySchema = z.array(
	z.object({ runId: z.string().min(1), status: z.string() }),
);
export interface AttentionScan {
	checked: number;
	complete: boolean;
	errors: string[];
}

/** Page through accessible activity with at most four concurrent readers, never a run event stream. */
export async function scanAgentAttention({
	actions,
	insightId,
	previous,
	isCancelled,
	onRun,
	onProgress,
}: {
	actions: InsightActions;
	insightId: string;
	previous: AgentRun[];
	isCancelled: () => boolean;
	onRun: (run: AgentRun) => void;
	onProgress: (progress: AttentionScan) => void;
}): Promise<void> {
	const progress: AttentionScan = { checked: 0, complete: false, errors: [] };
	const seen = new Set<string>();
	async function inspect(id: string): Promise<void> {
		if (seen.has(id) || isCancelled()) return;
		seen.add(id);
		try {
			const run = await readRun(insightId, id, false);
			if (!isCancelled()) onRun(run);
		} catch {
			progress.errors.push("Some pending runs could not be refreshed.");
		}
	}
	for (let index = 0; index < previous.length && !isCancelled(); index += 4)
		await Promise.all(
			previous.slice(index, index + 4).map((run) => inspect(run.runId)),
		);
	const agents = new Set<string>();
	const configured = getThreadAgent();
	if (configured) agents.add(configured.id);
	try {
		for (let offset = 0; !isCancelled(); offset += 25) {
			const page = await callPixel(
				actions,
				agentListPixel({ limit: 25, offset }),
				projectListSchema,
			);
			for (const agent of page) agents.add(agent.project_id);
			if (page.length < 25) break;
		}
	} catch {
		progress.errors.push("The agent directory could not be fully read.");
	}
	const queue = [...agents].map((id) => ({ id, offset: 0 }));
	while (queue.length && !isCancelled()) {
		const batch = queue.splice(0, 4);
		await Promise.all(
			batch.map(async (entry) => {
				try {
					const page = await callPixel(
						actions,
						pixel("GetAgentActivityLog", {
							agentId: entry.id,
							limit: 50,
							offset: entry.offset,
						}),
						activitySchema,
					);
					for (const run of page) {
						if (isCancelled()) return;
						progress.checked++;
						if (
							["INPUT_REQUIRED", "RUNNING", "SUBMITTED"].includes(
								run.status,
							)
						)
							await inspect(run.runId);
					}
					if (page.length === 50)
						queue.push({ ...entry, offset: entry.offset + 50 });
				} catch {
					progress.errors.push(
						"Some agent activity could not be read.",
					);
				}
			}),
		);
		if (!isCancelled())
			onProgress({ ...progress, errors: [...new Set(progress.errors)] });
	}
	if (!isCancelled())
		onProgress({
			...progress,
			complete: progress.errors.length === 0,
			errors: [...new Set(progress.errors)],
		});
}
