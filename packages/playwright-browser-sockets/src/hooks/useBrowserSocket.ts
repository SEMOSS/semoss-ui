import { useCallback, useEffect, useRef, useState } from "react";
import type {
	ClientToServerEvent,
	ConnectionState,
	SelectedTextContext,
	SelectionBounds,
	ServerToClientEvent,
} from "../types/browserEvents";

interface UseBrowserSocketOptions {
	wsUrl: string | null;
	onFrame: (data: string, width: number, height: number) => void;
	onNavigated: (url: string) => void;
	onError: (message: string) => void;
}

interface UseBrowserSocketReturn {
	connectionState: ConnectionState;
	sendEvent: (event: ClientToServerEvent) => void;
	sendReplayEvent: (
		event: ClientToServerEvent & { requestId: string },
	) => Promise<void>;
	captureSelectedText: (
		bounds: SelectionBounds,
	) => Promise<SelectedTextContext>;
}

interface PendingReplay {
	resolve: () => void;
	reject: (error: Error) => void;
	timeout: ReturnType<typeof setTimeout>;
}

interface PendingSelectedText {
	resolve: (context: SelectedTextContext) => void;
	reject: (error: Error) => void;
	timeout: ReturnType<typeof setTimeout>;
}

const MODULE_PATH = process.env.MODULE || "/Monolith";
const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_BASE =
	import.meta.env.VITE_WS_BASE_URL ||
	`${WS_PROTOCOL}//${window.location.host}${MODULE_PATH}`;

export function useBrowserSocket({
	wsUrl,
	onFrame,
	onNavigated,
	onError,
}: UseBrowserSocketOptions): UseBrowserSocketReturn {
	const [connectionState, setConnectionState] =
		useState<ConnectionState>("idle");
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingReplayRef = useRef<Map<string, PendingReplay>>(new Map());
	const pendingSelectedTextRef = useRef<Map<string, PendingSelectedText>>(
		new Map(),
	);

	// Build the full WS URL from the relative path returned by the REST API
	const buildFullWsUrl = useCallback((path: string): string => {
		if (/^wss?:\/\//i.test(path)) {
			return path;
		}

		if (/^https?:\/\//i.test(path)) {
			return path.replace(/^http/i, "ws");
		}

		// If VITE_WS_BASE_URL is defined use it, otherwise derive from current location.
		const base = WS_BASE.replace(/\/$/, "");
		return `${base}${path}`;
	}, []);

	useEffect(() => {
		if (!wsUrl) return;

		const fullUrl = buildFullWsUrl(wsUrl);
		setConnectionState("connecting");

		const ws = new WebSocket(fullUrl);
		wsRef.current = ws;

		ws.onopen = () => {
			setConnectionState("connected");
		};

		ws.onmessage = (evt: MessageEvent) => {
			try {
				const msg: ServerToClientEvent = JSON.parse(evt.data as string);
				switch (msg.type) {
					case "frame":
						onFrame(
							msg.data,
							msg.metadata.width,
							msg.metadata.height,
						);
						break;
					case "navigated":
						onNavigated(msg.url);
						break;
					case "replay-step-result": {
						const pending = pendingReplayRef.current.get(
							msg.requestId,
						);
						if (!pending) break;
						window.clearTimeout(pending.timeout);
						pendingReplayRef.current.delete(msg.requestId);
						if (msg.success) {
							pending.resolve();
						} else {
							pending.reject(
								new Error(msg.error || "Replay step failed"),
							);
						}
						break;
					}
					case "selected-text-context-result": {
						const pending = pendingSelectedTextRef.current.get(
							msg.requestId,
						);
						if (!pending) break;
						window.clearTimeout(pending.timeout);
						pendingSelectedTextRef.current.delete(msg.requestId);
						if (msg.success && msg.context) {
							pending.resolve(msg.context);
						} else {
							pending.reject(
								new Error(
									msg.error || "Selected text capture failed",
								),
							);
						}
						break;
					}
					case "error":
						onError(msg.message);
						break;
				}
			} catch {
				// Malformed message — ignore
			}
		};

		ws.onclose = () => {
			setConnectionState("closed");
			wsRef.current = null;
			pendingReplayRef.current.forEach((pending) => {
				window.clearTimeout(pending.timeout);
				pending.reject(
					new Error("Browser connection closed during replay"),
				);
			});
			pendingReplayRef.current.clear();
			pendingSelectedTextRef.current.forEach((pending) => {
				window.clearTimeout(pending.timeout);
				pending.reject(
					new Error(
						"Browser connection closed during selected text capture",
					),
				);
			});
			pendingSelectedTextRef.current.clear();
		};

		ws.onerror = () => {
			setConnectionState("error");
		};

		return () => {
			if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
			ws.close();
		};
	}, [wsUrl, buildFullWsUrl, onFrame, onNavigated, onError]);

	const sendEvent = useCallback((event: ClientToServerEvent) => {
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(event));
		}
	}, []);

	const sendReplayEvent = useCallback(
		(event: ClientToServerEvent & { requestId: string }): Promise<void> => {
			const ws = wsRef.current;
			if (!ws || ws.readyState !== WebSocket.OPEN) {
				return Promise.reject(
					new Error("Browser connection is not ready for replay"),
				);
			}
			return new Promise<void>((resolve, reject) => {
				const timeout = window.setTimeout(() => {
					pendingReplayRef.current.delete(event.requestId);
					reject(
						new Error(
							"Timed out waiting for replay step completion",
						),
					);
				}, 30_000);
				pendingReplayRef.current.set(event.requestId, {
					resolve,
					reject,
					timeout,
				});
				ws.send(JSON.stringify(event));
			});
		},
		[],
	);

	const captureSelectedText = useCallback(
		(bounds: SelectionBounds): Promise<SelectedTextContext> => {
			const ws = wsRef.current;
			if (!ws || ws.readyState !== WebSocket.OPEN) {
				return Promise.reject(
					new Error(
						"Browser connection is not ready for selected text capture",
					),
				);
			}
			const requestId = crypto.randomUUID();
			return new Promise<SelectedTextContext>((resolve, reject) => {
				const timeout = window.setTimeout(() => {
					pendingSelectedTextRef.current.delete(requestId);
					reject(
						new Error(
							"Timed out while capturing selected website text",
						),
					);
				}, 20_000);
				pendingSelectedTextRef.current.set(requestId, {
					resolve,
					reject,
					timeout,
				});
				ws.send(
					JSON.stringify({
						type: "selected-text-context",
						requestId,
						x: bounds.startX,
						y: bounds.startY,
						endX: bounds.endX,
						endY: bounds.endY,
					}),
				);
			});
		},
		[],
	);

	return {
		connectionState,
		sendEvent,
		sendReplayEvent,
		captureSelectedText,
	};
}
