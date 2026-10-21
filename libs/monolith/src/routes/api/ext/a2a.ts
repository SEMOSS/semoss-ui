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
 * `ApiClient.configure({ auth })`).
 */

import type { RequestOptions } from "@/types";
import { get, post } from "@/utility/http";
import { path } from "@/utility/url";

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
 * @remarks Unverified response shape. Serialized by reflection from the A2A SDK classes; nested shapes are typed loosely.
 */
export function agentCard(
	params: { workspaceId: string },
	options?: RequestOptions,
): Promise<{
	name: string;
	description: string;
	/** Always `"1.0"`. */
	version: string;
	/** The JSON-RPC endpoint (`…/api/ext/a2a/workspace/{workspaceId}/rpc`). */
	url: string;
	preferredTransport: "JSONRPC";
	supportedInterfaces: Array<{
		protocolBinding: string;
		url: string;
		[key: string]: unknown;
	}>;
	defaultInputModes: string[];
	defaultOutputModes: string[];
	capabilities: {
		streaming: boolean;
		pushNotifications: boolean;
		extendedAgentCard: boolean;
		[key: string]: unknown;
	};
	skills: Array<{
		id: string;
		name: string;
		description: string;
		tags?: string[];
		[key: string]: unknown;
	}>;
	securitySchemes: Record<string, Record<string, unknown>>;
	securityRequirements: Array<{ schemes: Record<string, string[]> }>;
	[key: string]: unknown;
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
 * @remarks Unverified response shape. `status.state` and message `role` are Gson-serialized SDK enums (e.g. `"TASK_STATE_COMPLETED"`, `"ROLE_AGENT"`).
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
		params?: Record<string, unknown>;
	},
	options?: RequestOptions,
): Promise<{
	jsonrpc: "2.0";
	id: string | number | null;
	result?:
		| {
				task: {
					id: string;
					contextId: string;
					status: {
						state?: string;
						message?: Record<string, unknown>;
						timestamp?: string;
					};
					artifacts: Array<{
						artifactId?: string;
						name?: string;
						description?: string;
						parts: Array<{ text?: string; [key: string]: unknown }>;
						[key: string]: unknown;
					}>;
					history: Array<Record<string, unknown>>;
					/** `semossStatus`, `workspaceId`, `modelId`, `jobId`, `inputMessageId`, `finalOutputMessageId`, `errorMessage`. */
					metadata?: Record<string, unknown>;
				};
		  }
		| {
				id: string;
				contextId: string;
				status: {
					state?: string;
					message?: Record<string, unknown>;
					timestamp?: string;
				};
				artifacts: Array<{
					artifactId?: string;
					name?: string;
					description?: string;
					parts: Array<{ text?: string; [key: string]: unknown }>;
					[key: string]: unknown;
				}>;
				history: Array<Record<string, unknown>>;
				metadata?: Record<string, unknown>;
		  };
	error?: { code: number; message: string };
}> {
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
		params?: Record<string, unknown>;
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
