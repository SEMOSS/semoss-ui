/**
 * Model Context Protocol (MCP) server for a toolbox — `/api/ext/mcp/{toolbox_id}`.
 *
 * Backend: `MCPResource`
 * (Monolith/src/prerna/semoss/web/services/local/MCPResource.java); messages
 * are answered by `MCPReaper` (Monolith/src/prerna/mcp/MCPReaper.java).
 *
 * The caller is the session user, or the session bound to the `Authorization`
 * header (an access key or bearer token, see `ApiClient.configure({ auth })`).
 * Each authorization key (or session) gets its own cached insight.
 */

import type { RequestOptions } from "../../../types";
import { post } from "../../../utility/http";
import { path } from "../../../utility/url";

/**
 * Sends one MCP JSON-RPC message over the streamable-HTTP transport
 * (`initialize`, `tools/list`, `tools/call`, notifications, …) and returns the
 * JSON-RPC response. A notification (no `id`) is acknowledged with an empty
 * 202. Sends `Accept: application/json` to select this route over the SSE one.
 *
 * @name comms
 * @endpoint POST /api/ext/mcp/{toolbox_id}/comms
 * @source Monolith/src/prerna/semoss/web/services/local/MCPResource.java#commsHttp
 * @param params - Path and query parameters plus the JSON-RPC message.
 * @param params.toolbox_id - The toolbox (path).
 * @param params.access_key - Query parameter the Java declares but never reads.
 * @param params.jsonrpc - Protocol version, `"2.0"`.
 * @param params.id - Request id; omit for a notification.
 * @param params.method - The MCP method, e.g. `"tools/call"`.
 * @param params.params - The method parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The JSON-RPC response, or `undefined` for a notification.
 * @throws {ApiError} When the session has no user (the Java fails while creating the insight).
 * @remarks Unverified response shape. The MCP result depends on the method and is produced by `MCPReaper.generateResponse`.
 */
export function comms(
	params: {
		toolbox_id: string;
		access_key?: string;
		jsonrpc?: "2.0";
		id?: string | number;
		method: string;
		params?: Record<string, unknown>;
	},
	options?: RequestOptions,
): Promise<
	| {
			jsonrpc: "2.0";
			id: string | number | null;
			result?: unknown;
			error?: { code: number; message: string; data?: unknown };
	  }
	| undefined
> {
	const { toolbox_id, access_key, ...body } = params;
	return post(
		path`/api/ext/mcp/${toolbox_id}/comms`,
		body,
		{
			...options,
			headers: { Accept: "application/json", ...options?.headers },
		},
		{ bodyType: "json", query: { access_key } },
	);
}

/**
 * Sends one MCP JSON-RPC message over the legacy SSE transport (`Accept:
 * text/event-stream` is set for you). The first line of the body is read and
 * answered on the stream, after which the stream closes.
 *
 * @name commsSse
 * @endpoint POST /api/ext/mcp/{toolbox_id}/comms
 * @source Monolith/src/prerna/semoss/web/services/local/MCPResource.java#commsSse
 * @param params - Path and query parameters plus the JSON-RPC message.
 * @param params.toolbox_id - The toolbox (path).
 * @param params.access_key - Query parameter the Java declares but never reads.
 * @param params.jsonrpc - Protocol version, `"2.0"`.
 * @param params.id - Request id; omit for a notification.
 * @param params.method - The MCP method, e.g. `"tools/list"`.
 * @param params.params - The method parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The raw SSE stream carrying the JSON-RPC response.
 * @throws {ApiError} When the session has no user (the Java fails while creating the insight).
 */
export function commsSse(
	params: {
		toolbox_id: string;
		access_key?: string;
		jsonrpc?: "2.0";
		id?: string | number;
		method: string;
		params?: Record<string, unknown>;
	},
	options?: RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
	const { toolbox_id, access_key, ...body } = params;
	return post(
		path`/api/ext/mcp/${toolbox_id}/comms`,
		body,
		{
			...options,
			headers: { Accept: "text/event-stream", ...options?.headers },
		},
		{ bodyType: "json", responseType: "stream", query: { access_key } },
	);
}
