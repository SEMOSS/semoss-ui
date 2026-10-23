/**
 * Agent-to-Agent (A2A) protocol for a workspace — `/api/ext/a2a/workspace/{workspaceId}`.
 *
 * Backend: `A2AResource`
 * (Monolith/src/prerna/semoss/web/services/local/A2AResource.java), built on
 * the `org.a2aproject.sdk` 1.1 spec types. A message runs the workspace's
 * SEMOSS agent through `AgentRunService`; an A2A task id is the agent run id.
 *
 * Every route answers 404 `{ error: "A2A is disabled" }` unless the server sets
 * `A2A_ENABLED=true`. The RPC routes authenticate with the session or an
 * `Authorization` header (an access key or bearer token, see
 * `Env.update({ BEARER_TOKEN })`).
 */

import type { RequestOptions } from "../../../lib/api-types";
import { get, post } from "../../../lib/http";
import { path } from "../../../lib/url";

/** Text-only message input accepted by A2AResource.extractTextInput. */
export interface A2AMessageInput {
	parts?: Array<{
		kind?: "text" | "text/plain";
		type?: "text" | "text/plain";
		text?: string;
		content?: string;
	}>;
	text?: string;
	content?: string;
	contextId?: string;
	sessionId?: string;
	/** Provider/agent metadata; engine, engineId, and modelId are used as model fallbacks. */
	metadata?: Record<string, unknown>;
}

/** Parameters read by the server's five JSON-RPC methods. */
export interface A2ARpcParams extends A2AMessageInput {
	message?: A2AMessageInput;
	engine?: string;
	engineId?: string;
	modelId?: string;
	id?: string;
	taskId?: string;
	runId?: string;
	configuration?: { returnImmediately?: boolean };
}

/** Current task-state mapping in A2AResource.toTaskState; Gson emits enum names. */
export type A2ATaskState =
	| "TASK_STATE_SUBMITTED"
	| "TASK_STATE_WORKING"
	| "TASK_STATE_INPUT_REQUIRED"
	| "TASK_STATE_COMPLETED"
	| "TASK_STATE_CANCELED"
	| "TASK_STATE_FAILED"
	| "UNRECOGNIZED";

/** The text message constructed from an agent run's finalText. */
export interface A2AMessage {
	role: "ROLE_AGENT";
	messageId: string;
	contextId: string;
	taskId: string;
	parts: Array<{ text: string }>;
}

/** Serializer-traced task snapshot produced by taskFromRun and taskPayload. */
export interface A2ATask {
	id: string;
	contextId: string;
	status: { state: A2ATaskState; message?: A2AMessage; timestamp?: string };
	artifacts: Array<{
		artifactId: string;
		name: "final-output";
		description: "Final agent response";
		parts: Array<{ text: string }>;
	}>;
	/** The current producer does not populate task history. */
	history: A2AMessage[];
	metadata?: {
		semossStatus?: string;
		workspaceId?: string;
		modelId?: string;
		jobId?: string;
		inputMessageId?: string;
		finalOutputMessageId?: string;
		errorMessage?: string;
	};
}

/** JSON-RPC envelope; Gson omits an absent or explicitly null request id. */
export interface A2ARpcResponse {
	jsonrpc: "2.0";
	id?: string | number;
	result?: A2ATask | { task: A2ATask };
	error?: { code: number; message?: string };
}

/**
 * Returns the workspace's A2A agent card: its name and description (from the
 * workspace row), the JSON-RPC endpoint URL, its skills (from the workspace
 * `config_json.skills`, or one default "SEMOSS Agent" skill) and the bearer
 * security scheme. Does not check the caller's session.
 *
 * @name agentCard
 * @endpoint GET /api/ext/a2a/workspace/{workspaceId}/.well-known/agent-card.json
 * @source Monolith/src/prerna/semoss/web/services/local/A2AResource.java#agentCard
 * @param params - Path parameters.
 * @param params.workspaceId - The workspace.
 * @param options - Per-call overrides (signal, headers).
 * @returns The agent card, serialized by Gson from the SDK `AgentCard` (null fields omitted).
 * @throws {ApiError} 404 if A2A is disabled.
 * @remarks Verified against A2AResource.buildAgentCard and the local a2a-java-sdk-spec 1.1.0.Final record fields and builder defaults. Gson serializes fields, not computed protocol getters.
 */
export function agentCard(
	params: { workspaceId: string },
	options?: RequestOptions,
): Promise<{
	name: string;
	description: string;
	version: "1.0";
	url: string;
	preferredTransport: "JSONRPC";
	supportedInterfaces: Array<{
		protocolBinding: "JSONRPC";
		url: string;
		protocolVersion: "1.0";
	}>;
	defaultInputModes: string[];
	defaultOutputModes: string[];
	capabilities: {
		streaming: true;
		pushNotifications: false;
		extendedAgentCard: false;
	};
	skills: Array<{
		id: string;
		name: string;
		description: string;
		tags: string[];
	}>;
	securitySchemes: {
		semossBearer: { scheme: "Bearer"; description: string };
	};
	securityRequirements: Array<{ schemes: { semossBearer: string[] } }>;
}> {
	const { workspaceId } = params;
	return get(
		path`/api/ext/a2a/workspace/${workspaceId}/.well-known/agent-card.json`,
		undefined,
		options,
	);
}

/**
 * Handles one A2A JSON-RPC call and answers with a JSON-RPC envelope.
 * `SendMessage` starts an agent run on the workspace (the model comes from
 * `params.engine` / `engineId` / `modelId`, their `metadata` equivalents, the
 * workspace config, or `A2A_DEFAULT_MODEL_ID`) and waits for it unless
 * `configuration.returnImmediately` is set; `GetTask` and `CancelTask` read or
 * stop a run by `params.id` / `taskId` / `runId`; `SendStreamingMessage` and
 * `SubscribeToTask` return a single snapshot here (use {@link rpcSse} to
 * stream). Only text parts are accepted. Sends `Accept: application/json` to
 * select this route over the SSE one.
 *
 * @name rpc
 * @endpoint POST /api/ext/a2a/workspace/{workspaceId}/rpc
 * @source Monolith/src/prerna/semoss/web/services/local/A2AResource.java#rpc
 * @param params - Path parameter plus the JSON-RPC request body.
 * @param params.workspaceId - The workspace (path).
 * @param params.jsonrpc - Protocol version, `"2.0"`.
 * @param params.id - Request id, echoed back.
 * @param params.method - The A2A method.
 * @param params.params - Method parameters: `message` (with text `parts`), `contextId` / `sessionId` (the room), `engineId` / `modelId`, `metadata`, `configuration.returnImmediately`, or the task `id` for task methods.
 * @param options - Per-call overrides (signal, headers).
 * @returns The JSON-RPC response. `result` is `{ task }` for `SendMessage` and the streaming methods, or the task itself for `GetTask` / `CancelTask`. An unsupported method comes back with status 200 and an `error` (-32601).
 * @throws {ApiError} 400 for bad params or a non-text part (body carries a JSON-RPC `error`), 401 without an authenticated user, 404 if A2A is disabled, 500 for a failed run.
 * @remarks Task/message/artifact fields follow the explicit A2AResource serializers. Enum values retain their Java names. Null response ids are omitted.
 */
export function rpc(
	params: {
		workspaceId: string;
		jsonrpc?: "2.0";
		id?: string | number | null;
		method:
			| "SendMessage"
			| "GetTask"
			| "CancelTask"
			| "SendStreamingMessage"
			| "SubscribeToTask";
		params?: A2ARpcParams;
	},
	options?: RequestOptions,
): Promise<A2ARpcResponse> {
	const { workspaceId, ...body } = params;
	return post(
		path`/api/ext/a2a/workspace/${workspaceId}/rpc`,
		body,
		{
			...options,
			headers: { Accept: "application/json", ...options?.headers },
		},
		{ bodyType: "json" },
	);
}

/**
 * Same JSON-RPC route as {@link rpc}, negotiated as `text/event-stream`
 * (`Accept` is set for you). Only `SendStreamingMessage` and `SubscribeToTask`
 * are accepted: the stream sends a `task` event with the run snapshot, then a
 * `status` event (`{ statusUpdate }`) each time the run's state changes, polled
 * every second until the task is final. Failures arrive as an `error` event.
 *
 * @name rpcSse
 * @endpoint POST /api/ext/a2a/workspace/{workspaceId}/rpc
 * @source Monolith/src/prerna/semoss/web/services/local/A2AResource.java#rpcSse
 * @param params - Path parameter plus the JSON-RPC request body.
 * @param params.workspaceId - The workspace (path).
 * @param params.jsonrpc - Protocol version, `"2.0"`.
 * @param params.id - Request id, echoed on every event.
 * @param params.method - `SendStreamingMessage` or `SubscribeToTask`.
 * @param params.params - Method parameters, as for {@link rpc}.
 * @param options - Per-call overrides (signal, headers).
 * @returns The raw SSE stream; each event's `data` is a JSON-RPC envelope.
 * @throws {ApiError} 401 without an authenticated user. Every other failure, including A2A being disabled, arrives as an `error` event.
 */
export function rpcSse(
	params: {
		workspaceId: string;
		jsonrpc?: "2.0";
		id?: string | number | null;
		method: "SendStreamingMessage" | "SubscribeToTask";
		params?: A2ARpcParams;
	},
	options?: RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
	const { workspaceId, ...body } = params;
	return post(
		path`/api/ext/a2a/workspace/${workspaceId}/rpc`,
		body,
		{
			...options,
			headers: { Accept: "text/event-stream", ...options?.headers },
		},
		{ bodyType: "json", responseType: "stream" },
	);
}
