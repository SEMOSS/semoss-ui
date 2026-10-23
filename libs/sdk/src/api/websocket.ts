import { Env } from "../env";

export type WebSocketStatus = "connecting" | "connected" | "disconnected";

export interface InsightWebSocketOptions {
	/** Called when a message is received from the server */
	onMessage?: (data: unknown) => void;
	/** Called when the connection status changes */
	onStatusChange?: (status: WebSocketStatus) => void;
	/** Called when an error occurs */
	onError?: (event: Event) => void;
	/** Enable automatic reconnection (default: true) */
	reconnect?: boolean;
	/** Maximum number of reconnect attempts (default: 5) */
	maxReconnectAttempts?: number;
}

/**
 * WebSocket client for communicating with the Monolith insightSocket endpoint.
 *
 * Legacy usage (retained for compatibility):
 * ```ts
 * const ws = new InsightWebSocket("my-insight-id", {
 *   onMessage: (data) => console.log("Received:", data),
 *   onStatusChange: (status) => console.log("Status:", status),
 * });
 * ws.connect();
 * ws.send("GetSystemConfig();");
 * ws.close();
 * ```
 *
 * @deprecated Use native `WebSocket` with `insightSocketUrl({ insightId })`
 * from `@semoss/sdk/api/monolith/session`. No managed replacement exists:
 * own connection status, JSON messages, errors, reconnection, timers and cleanup.
 * Preserve the pixel/watch/unwatch message envelopes below. Construct built-in
 * Pixel expressions with `buildPixel` from `@semoss/sdk`; use `rawPixel` only
 * for trusted expression fragments, never for user-provided literal text.
 * @example
 * ```ts
 * import { buildPixel } from "@semoss/sdk";
 * import { insightSocketUrl } from "@semoss/sdk/api/monolith/session";
 * const insightId = "insight-id";
 * const socket = new WebSocket(insightSocketUrl({ insightId }));
 * socket.addEventListener("open", () => {
 *     socket.send(JSON.stringify({
 *         action: "pixel", insightId, pixel: buildPixel("GetProjectList"),
 *     }));
 * });
 * // Register message/error/close handlers and call socket.close() on teardown.
 * ```
 */
export class InsightWebSocket {
	private ws: WebSocket | null = null;
	private insightId: string;
	private options: Required<InsightWebSocketOptions>;
	private reconnectAttempts = 0;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private closed = false;

	/**
	 * @deprecated Use `new WebSocket(insightSocketUrl({ insightId }))` with
	 * `insightSocketUrl` from `@semoss/sdk/api/monolith/session`. Native construction
	 * opens immediately; the caller owns event handlers, reconnect policy and cleanup.
	 */
	constructor(insightId: string, options: InsightWebSocketOptions = {}) {
		this.insightId = insightId;
		this.options = {
			onMessage: options.onMessage ?? (() => {}),
			onStatusChange: options.onStatusChange ?? (() => {}),
			onError: options.onError ?? (() => {}),
			reconnect: options.reconnect ?? true,
			maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
		};
	}

	/** Build the WebSocket URL from the current page location and Env.MODULE */
	private buildUrl(): string {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const host = window.location.host;
		return `${protocol}//${host}${Env.MODULE}/insightSocket?insightId=${encodeURIComponent(this.insightId)}`;
	}

	/**
	 * Open the WebSocket connection.
	 * @deprecated Construct native `WebSocket` using `insightSocketUrl` from
	 * `@semoss/sdk/api/monolith/session`; wait for its open event before sending.
	 */
	connect(): void {
		this.closed = false;
		this.reconnectAttempts = 0;
		this.open();
	}

	private open(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		const url = this.buildUrl();
		this.options.onStatusChange("connecting");

		const ws = new WebSocket(url);

		ws.onopen = () => {
			this.reconnectAttempts = 0;
			this.options.onStatusChange("connected");
		};

		ws.onmessage = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				this.options.onMessage(data);
			} catch {
				// If the message isn't JSON, pass the raw string
				this.options.onMessage(event.data);
			}
		};

		ws.onerror = (event: Event) => {
			this.options.onError(event);
		};

		ws.onclose = () => {
			this.options.onStatusChange("disconnected");
			this.ws = null;

			if (!this.closed && this.options.reconnect) {
				this.scheduleReconnect();
			}
		};

		this.ws = ws;
	}

	private scheduleReconnect(): void {
		if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
			return;
		}

		const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
		this.reconnectAttempts++;

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			if (!this.closed) {
				this.open();
			}
		}, delay);
	}

	/**
	 * Send a pixel expression over the WebSocket.
	 * @deprecated Use native `WebSocket.send(JSON.stringify({ action: "pixel",
	 * insightId, pixel }))` on a socket created with `insightSocketUrl` from
	 * `@semoss/sdk/api/monolith/session`. Build pixel with `buildPixel` from
	 * `@semoss/sdk` and wait for WebSocket.OPEN before sending.
	 */
	send(pixel: string): void {
		this.sendRaw({
			action: "pixel",
			insightId: this.insightId,
			pixel,
		});
	}

	/**
	 * Start a streamer on the backend for the given type.
	 * New data will arrive as messages via onMessage.
	 *
	 * @param type   - registered streamer type (e.g. "claude_code")
	 * @param params - additional params passed to the streamer factory
	 * @deprecated Use native `WebSocket.send(JSON.stringify({ action: "watch",
	 * type, ...params }))` on a socket created with `insightSocketUrl` from
	 * `@semoss/sdk/api/monolith/session`. Own message handling and subscription cleanup.
	 */
	watch(type: string, params: Record<string, unknown> = {}): void {
		this.sendRaw({ action: "watch", type, ...params });
	}

	/**
	 * Stop a streamer by type and params (must match what was passed to watch).
	 * @deprecated Use native `WebSocket.send(JSON.stringify({ action: "unwatch",
	 * type, ...params }))` on a socket created with `insightSocketUrl` from
	 * `@semoss/sdk/api/monolith/session`; match the original watch type and params.
	 */
	unwatch(type: string, params: Record<string, unknown> = {}): void {
		this.sendRaw({ action: "unwatch", type, ...params });
	}

	/**
	 * Send a raw JSON message over the WebSocket.
	 * @deprecated Use native `WebSocket.send(JSON.stringify(data))` on a socket
	 * created with `insightSocketUrl` from `@semoss/sdk/api/monolith/session`.
	 * Check WebSocket.OPEN before sending and retain the backend message envelope.
	 */
	sendRaw(data: Record<string, unknown>): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new Error(
				"WebSocket is not connected. Call connect() first.",
			);
		}

		this.ws.send(JSON.stringify(data));
	}

	/**
	 * Close the WebSocket connection.
	 * @deprecated Use native `WebSocket.close()` for a socket created with
	 * `insightSocketUrl` from `@semoss/sdk/api/monolith/session`; also cancel any
	 * caller-owned reconnect timers and detach event handlers during teardown.
	 */
	close(): void {
		this.closed = true;

		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	/**
	 * Whether the socket is currently open.
	 * @deprecated Read native `socket.readyState === WebSocket.OPEN` for a socket
	 * created with `insightSocketUrl` from `@semoss/sdk/api/monolith/session`.
	 */
	get isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}
