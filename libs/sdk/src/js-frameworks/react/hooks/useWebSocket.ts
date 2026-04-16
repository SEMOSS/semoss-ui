import { useCallback, useEffect, useRef, useState } from "react";
import {
	InsightWebSocket,
	type InsightWebSocketOptions,
	type WebSocketStatus,
} from "../../../api/websocket";

interface UseWebSocketOptions
	extends Pick<
		InsightWebSocketOptions,
		"reconnect" | "maxReconnectAttempts"
	> {
	/** Connect automatically on mount (default: true) */
	autoConnect?: boolean;
}

interface UseWebSocketReturn {
	/** Send a pixel expression over the WebSocket */
	send: (pixel: string) => void;
	/** Start a streamer on the backend (e.g. watch("claude_code", { roomId: "abc" })) */
	watch: (type: string, params?: Record<string, unknown>) => void;
	/** Stop a streamer on the backend */
	unwatch: (type: string, params?: Record<string, unknown>) => void;
	/** The last message received from the server */
	lastMessage: unknown | null;
	/** Current connection status */
	status: WebSocketStatus;
	/** Convenience boolean for status === "connected" */
	isConnected: boolean;
	/** Manually open the connection */
	connect: () => void;
	/** Manually close the connection */
	close: () => void;
}

/**
 * React hook for managing a WebSocket connection to the insightSocket endpoint.
 *
 * @param insightId - The insight ID to connect with
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * function MyComponent({ insightId }: { insightId: string }) {
 *   const { send, lastMessage, isConnected } = useWebSocket(insightId);
 *
 *   return (
 *     <div>
 *       <p>Connected: {isConnected ? "Yes" : "No"}</p>
 *       <button onClick={() => send("GetSystemConfig();")}>Send</button>
 *       <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWebSocket(
	insightId: string,
	options: UseWebSocketOptions = {},
): UseWebSocketReturn {
	const { autoConnect = true, reconnect, maxReconnectAttempts } = options;

	const [lastMessage, setLastMessage] = useState<unknown | null>(null);
	const [status, setStatus] = useState<WebSocketStatus>("disconnected");
	const wsRef = useRef<InsightWebSocket | null>(null);

	useEffect(() => {
		const ws = new InsightWebSocket(insightId, {
			onMessage: setLastMessage,
			onStatusChange: setStatus,
			reconnect,
			maxReconnectAttempts,
		});

		wsRef.current = ws;

		if (autoConnect) {
			ws.connect();
		}

		return () => {
			ws.close();
			wsRef.current = null;
		};
	}, [insightId, autoConnect, reconnect, maxReconnectAttempts]);

	const send = useCallback((pixel: string) => {
		wsRef.current?.send(pixel);
	}, []);

	const watch = useCallback(
		(type: string, params?: Record<string, unknown>) => {
			wsRef.current?.watch(type, params);
		},
		[],
	);

	const unwatch = useCallback(
		(type: string, params?: Record<string, unknown>) => {
			wsRef.current?.unwatch(type, params);
		},
		[],
	);

	const connect = useCallback(() => {
		wsRef.current?.connect();
	}, []);

	const close = useCallback(() => {
		wsRef.current?.close();
	}, []);

	return {
		send,
		watch,
		unwatch,
		lastMessage,
		status,
		isConnected: status === "connected",
		connect,
		close,
	};
}
