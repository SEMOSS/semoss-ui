import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	type PixelStreamMessage,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk";

const POLL_INTERVAL_MS = 500;

export const TURN_CANCELLATION_PROMPT =
	"The user stopped your previous response before it finished. Treat it as incomplete, do not resume automatically, and wait for the user's next instruction.";
export const TOOL_INTERRUPTED_PROMPT =
	"Internal note: the user stopped before this tool finished, so its result is unavailable and whether it ran is uncertain.";

interface AskPlaygroundParams {
	engine: string;
	roomId: string;
	command: string;
	context: string;
	media: string[];
	parentMessageId: string;
	paramValues?: Record<string, unknown>[];
}

export interface AddPlaygroundToolParams {
	engine: string;
	roomId: string;
	parentMessageId: string;
	toolId: string;
	toolName: string;
	toolExecutionResponse: string;
	mcpToolStatus: "success" | "error" | "cancelled";
	toolParameterValues: Record<string, unknown>;
	paramValues?: Record<string, unknown>[];
}

export interface PlaygroundStatementResult {
	operationType: string[];
	output: unknown;
}

export interface PlaygroundJob {
	jobId: string;
	result: Promise<PlaygroundStatementResult[]>;
}

function encodedList(value: string): string {
	return JSON.stringify([`<encode>${value}</encode>`]);
}

/** Build the exact playground model-turn statement. */
export function buildAskPlaygroundStatement(
	params: AskPlaygroundParams,
	commit?: { responseParts: unknown[]; hiddenMessage: string },
): string {
	const clauses = [
		`engine=${JSON.stringify([params.engine])}`,
		`roomId=${JSON.stringify([params.roomId])}`,
		`command=${encodedList(params.command)}`,
		params.context
			? `context=${encodedList(params.context)}`
			: "context=[]",
		`media=${JSON.stringify(params.media)}`,
		`parentMessageId=${JSON.stringify([params.parentMessageId])}`,
		`paramValues=${JSON.stringify(params.paramValues ?? [{}])}`,
	];
	if (commit) {
		clauses.push(`responseParts=${JSON.stringify(commit.responseParts)}`);
		clauses.push(`hiddenMessage=${encodedList(commit.hiddenMessage)}`);
	}
	return `AskPlayground(${clauses.join(", ")});`;
}

/** Build one serialized playground tool-result write. */
export function buildAddPlaygroundToolExecutionStatement(
	params: AddPlaygroundToolParams,
	commit?: { responseParts: unknown[]; hiddenMessage: string },
): string {
	const clauses = [
		`engine=${JSON.stringify([params.engine])}`,
		`roomId=${JSON.stringify([params.roomId])}`,
		`parentMessageId=${JSON.stringify([params.parentMessageId])}`,
		`toolId=${JSON.stringify([params.toolId])}`,
		`toolName=${JSON.stringify([params.toolName])}`,
		`toolExecutionResponse=${encodedList(params.toolExecutionResponse)}`,
		`paramValues=${JSON.stringify(params.paramValues ?? [{}])}`,
		`mcpToolStatus=${JSON.stringify(params.mcpToolStatus)}`,
		`toolParameterValues=${JSON.stringify([params.toolParameterValues])}`,
	];
	if (commit) {
		clauses.push(`responseParts=${JSON.stringify(commit.responseParts)}`);
		clauses.push(`hiddenMessage=${encodedList(commit.hiddenMessage)}`);
	}
	return `AddPlaygroundToolExecution(${clauses.join(", ")});`;
}

interface ToolOwnerMetadata {
	SMSS_ENGINE_ID?: unknown;
	SMSS_PROJECT_ID?: unknown;
}

/** Resolve canonical engine ownership, retaining the room-tool sentinel. */
export function getToolEngineId(
	metadata: ToolOwnerMetadata | undefined,
): string {
	if (typeof metadata?.SMSS_ENGINE_ID === "string") {
		return metadata.SMSS_ENGINE_ID;
	}
	return typeof metadata?.SMSS_PROJECT_ID === "string"
		? metadata.SMSS_PROJECT_ID
		: "";
}

/** Build the client-driven MCP execution statement. */
export function buildRunMcpToolStatement(params: {
	ownerId: string;
	roomId: string;
	toolName: string;
	argumentsValue: Record<string, unknown>;
}): string {
	return `RunMCPTool(project=${JSON.stringify([params.ownerId])}, roomId=${JSON.stringify(params.roomId)}, function=${JSON.stringify([params.toolName])}, paramValues=${JSON.stringify([params.argumentsValue])});`;
}

async function observePlaygroundJob(
	jobId: string,
	onChunk: (chunk: PixelStreamMessage) => void,
): Promise<PlaygroundStatementResult[]> {
	for (;;) {
		const { message, status } = await getPixelJobStreaming(jobId);
		for (const chunk of message) onChunk(chunk);

		switch (status) {
			case "Complete":
			case "ProgressComplete": {
				const response = await getPixelAsyncResult<unknown[]>(jobId);
				if (response.errors.length > 0) {
					throw new Error(response.errors.join(", "));
				}
				return response.results.map((result) => ({
					operationType: result.operationType,
					output: result.output,
				}));
			}
			case "Canceled":
				throw new Error("Playground job was cancelled.");
			case "Error":
			case "UnknownJob":
				throw new Error(`Playground job ended with ${status}.`);
			case "Paused":
				throw new Error("Playground job paused unexpectedly.");
			case "Created":
			case "Submitted":
			case "InProgress":
			case "Streaming":
				await new Promise<void>((resolve) =>
					setTimeout(resolve, POLL_INTERVAL_MS),
				);
				break;
			default: {
				const exhaustive: never = status;
				throw new Error(`Unexpected playground status: ${exhaustive}`);
			}
		}
	}
}

/** Submit a streaming playground statement and expose its cancellable job id. */
export async function startPlaygroundJob(
	insightId: string,
	statement: string,
	onChunk: (chunk: PixelStreamMessage) => void,
): Promise<PlaygroundJob> {
	const { jobId } = await runPixelAsync(statement, insightId);
	if (!jobId) throw new Error("Playground did not return a job ID.");
	return {
		jobId,
		result: observePlaygroundJob(jobId, onChunk),
	};
}

/** Request cancellation of one active model-streaming pixel job. */
export async function stopPlaygroundJob(
	insightId: string,
	jobId: string,
): Promise<void> {
	const response = await runPixel(
		`StopPixelExecution(id=${JSON.stringify([jobId])});`,
		insightId,
	);
	if (response.errors.length > 0) throw new Error(response.errors.join(", "));
}

/** Execute one MCP tool without conflating execution and result persistence. */
export async function runMcpTool(
	insightId: string,
	params: {
		ownerId: string;
		roomId: string;
		toolName: string;
		argumentsValue: Record<string, unknown>;
	},
): Promise<string> {
	const response = await runPixel<[unknown]>(
		buildRunMcpToolStatement(params),
		insightId,
	);
	if (response.errors.length > 0) throw new Error(response.errors.join(", "));
	const output = response.pixelReturn[0]?.output;
	if (typeof output === "string") return output;
	try {
		const serialized = JSON.stringify(output);
		if (serialized === undefined) {
			throw new Error("Tool returned no readable output.");
		}
		return serialized;
	} catch (cause) {
		throw new Error("Tool output could not be read.", { cause });
	}
}

/** Run one or more non-streaming playground persistence statements. */
export async function runPlaygroundStatements(
	insightId: string,
	statement: string,
): Promise<PlaygroundStatementResult[]> {
	const response = await runPixel<unknown[]>(statement, insightId);
	if (response.errors.length > 0) throw new Error(response.errors.join(", "));
	return response.pixelReturn.map((result) => ({
		operationType: result.operationType,
		output: result.output,
	}));
}
