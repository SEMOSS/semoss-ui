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
 * Usage:
 * ```ts
 * const ws = new InsightWebSocket("my-insight-id", {
 *   onMessage: (data) => console.log("Received:", data),
 *   onStatusChange: (status) => console.log("Status:", status),
 * });
 * ws.connect();
 * ws.send("GetSystemConfig();");
 * ws.close();
 * ```
 */
export class InsightWebSocket {
	private ws: WebSocket | null = null;
	private insightId: string;
	private options: Required<InsightWebSocketOptions>;
	private reconnectAttempts = 0;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private closed = false;

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

	/** Open the WebSocket connection */
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

	/** Send a pixel expression over the WebSocket */
	send(pixel: string): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new Error(
				"WebSocket is not connected. Call connect() first.",
			);
		}

		this.ws.send(
			JSON.stringify({
				insightId: this.insightId,
				pixel,
			}),
		);
	}

	/** Close the WebSocket connection */
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

	/** Whether the socket is currently open */
	get isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}
