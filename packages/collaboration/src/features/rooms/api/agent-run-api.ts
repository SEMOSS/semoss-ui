import {
	decideAgentRunAction,
	getAgentRun,
	getSubagentRuns,
	pollAgentRun,
	runAgent,
	runPixel,
	stopAgentRun,
} from "@semoss/sdk";
import { z } from "@semoss/ui/next";
import { roomMessageSchema } from "@/features/messages/api/message-schemas";
import { pixel } from "@/lib/pixel";

const record = z.record(z.string(), z.unknown());
const statusSchema = z.enum([
	"SUBMITTED",
	"RUNNING",
	"INPUT_REQUIRED",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
]);
const toolStatusSchema = z.enum([
	"QUEUED",
	"RUNNING",
	"INPUT_REQUIRED",
	"COMPLETED",
	"FAILED",
	"REJECTED",
	"CANCELLED",
]);
const actionSchema = z.object({
	actionId: z.string().min(1),
	runId: z.string().min(1),
	parentMessageId: z.string().nullish(),
	toolCallId: z.string().nullish(),
	toolName: z.string().nullish(),
	toolArgs: record.nullish(),
	editedArgs: record.nullish(),
	toolMeta: record.nullish(),
	uiUrl: z.string().nullish(),
});

/** Validate both stream snapshots and durable run records at the SDK boundary. */
export const agentRunSchema = z.object({
	runId: z.string().min(1),
	// A delegation to a person has no room of its own on the owner's side.
	roomId: z.string().nullish(),
	status: statusSchema,
	inputMessageId: z.string().nullish(),
	finalOutputMessageId: z.string().nullish(),
	finalText: z.string().nullish(),
	errorMessage: z.string().nullish(),
	input: z.string().nullish(),
	workspaceName: z.string().nullish(),
	executorType: z.enum(["AGENT", "HUMAN"]).nullish(),
	executorLabel: z.string().nullish(),
	pendingActions: z
		.array(actionSchema)
		.nullish()
		.transform((value) => value ?? []),
	messages: z.array(roomMessageSchema).optional(),
	progress: z.object({ activity: z.string() }).nullish(),
});

/** Only fields used by the conversation are retained from harness events. */
export const agentItemSchema = z.discriminatedUnion("kind", [
	z.object({
		id: z.string(),
		kind: z.literal("message"),
		text: z.string(),
		messageId: z.string().nullish(),
	}),
	z.object({
		id: z.string(),
		kind: z.literal("reasoning"),
		summary: z.string(),
	}),
	z.object({
		id: z.string(),
		kind: z.literal("tool"),
		name: z.string(),
		title: z.string().nullish(),
		arguments: record,
		metadata: record.nullish(),
		status: toolStatusSchema,
		output: z.string().nullish(),
		error: z.string().nullish(),
		durationMs: z.number().nullish(),
	}),
	z.object({
		id: z.string(),
		kind: z.literal("subagent"),
		childRunId: z.string(),
		roomId: z.string(),
		alias: z.string().nullish(),
		status: statusSchema,
		error: z.string().nullish(),
		resultPreview: z.string().nullish(),
	}),
	z.object({
		id: z.string(),
		kind: z.literal("progress"),
		activity: z.string(),
	}),
]);

const eventBase = z.object({
	eventId: z.string(),
	sequence: z.number(),
	runId: z.string(),
});
const eventSchema = z.discriminatedUnion("type", [
	eventBase.extend({
		type: z.literal("item.started"),
		item: agentItemSchema,
	}),
	eventBase.extend({
		type: z.literal("item.completed"),
		item: agentItemSchema,
	}),
	eventBase.extend({
		type: z.literal("item.updated"),
		itemId: z.string(),
		delta: z.string().optional(),
		patch: record.optional(),
	}),
]);
const pollSchema = z.object({
	run: agentRunSchema,
	events: z.array(eventSchema),
	droppedEvents: z.number().default(0),
});

export type AgentRun = z.infer<typeof agentRunSchema>;
export type AgentItem = z.infer<typeof agentItemSchema>;
export type AgentEvent = z.infer<typeof eventSchema>;
export type AgentAction = z.infer<typeof actionSchema>;

export function isTerminalRun(run: Pick<AgentRun, "status">): boolean {
	return ["COMPLETED", "FAILED", "CANCELLED"].includes(run.status);
}

/** Start the SEMOSS harness with the selected workspace and model. */
export async function startAgentRun(
	insightId: string,
	params: {
		roomId: string;
		agentId: string;
		engine: string;
		command: string;
		media: string[];
		maxTurns: number;
		maxReflections?: number;
	},
): Promise<AgentRun> {
	// RunAgentReactor URL-decodes command. Encoding once also preserves literal % and +.
	return agentRunSchema.parse(
		await runAgent(
			{
				...params,
				command: encodeURIComponent(params.command),
				harnessType: "semoss",
			},
			insightId,
		),
	);
}

export async function pollRun(
	runId: string,
): Promise<z.infer<typeof pollSchema>> {
	return pollSchema.parse(await pollAgentRun(runId));
}

export async function readRun(
	insightId: string,
	runId: string,
	includeMessages = true,
): Promise<AgentRun> {
	return agentRunSchema.parse(
		await getAgentRun(runId, { includeMessages }, insightId),
	);
}

export async function cancelRun(
	insightId: string,
	runId: string,
): Promise<AgentRun> {
	return agentRunSchema.parse(await stopAgentRun(runId, insightId));
}

/** Durable room lookup also recovers runs submitted before a browser reload. */
export async function listRoomRuns(
	insightId: string,
	roomId: string,
): Promise<AgentRun[]> {
	const response = await runPixel<[unknown]>(
		pixel("GetAgentRunsForRoom", { roomId }),
		insightId,
	);
	if (response.errors.length) throw new Error(response.errors.join("\n"));
	return z.array(agentRunSchema).parse(response.pixelReturn[0]?.output);
}

export async function listChildRuns(
	insightId: string,
	runId: string,
): Promise<AgentRun[]> {
	return z
		.array(agentRunSchema)
		.parse(await getSubagentRuns(runId, insightId));
}

/** Send a decision to the run owning the action; the server executes/resumes it. */
export async function decideRunAction(
	insightId: string,
	action: AgentAction,
	decision: "submit" | "reject" | "respond",
	parameters?: Record<string, unknown>,
): Promise<void> {
	const resolved =
		decision === "submit"
			? JSON.stringify(parameters ?? {}) ===
				JSON.stringify(action.toolArgs ?? {})
				? "approve"
				: "edit"
			: decision;
	await decideAgentRunAction(
		{
			actionId: action.actionId,
			decision: resolved,
			paramValues: resolved === "edit" ? parameters : undefined,
			mcpToolResult:
				resolved === "respond"
					? JSON.stringify(parameters ?? {})
					: undefined,
		},
		insightId,
	);
}
