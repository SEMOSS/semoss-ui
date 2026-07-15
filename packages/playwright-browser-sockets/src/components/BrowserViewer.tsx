import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	ClientToServerEvent,
	ConnectionState,
} from "../types/browserEvents";

interface BrowserViewerProps {
	connectionState: ConnectionState;
	remoteWidth: number;
	remoteHeight: number;
	latestFrame: string | null;
	sendEvent: (event: ClientToServerEvent) => void;
	onUserInput?: () => void;
}

function getMouseButton(event: React.MouseEvent): "left" | "right" | "middle" {
	return event.button === 2
		? "right"
		: event.button === 1
			? "middle"
			: "left";
}

export const BrowserViewer: React.FC<BrowserViewerProps> = ({
	connectionState,
	remoteWidth,
	remoteHeight,
	latestFrame,
	sendEvent,
	onUserInput,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		if (!containerRef.current) return;
		const observer = new ResizeObserver(
			([entry]) =>
				entry &&
				setContainerSize({
					width: entry.contentRect.width,
					height: entry.contentRect.height,
				}),
		);
		observer.observe(containerRef.current);
		return () => observer.disconnect();
	}, []);

	const fittedCanvasSize = useMemo(() => {
		if (
			!containerSize.width ||
			!containerSize.height ||
			!remoteWidth ||
			!remoteHeight
		)
			return { width: remoteWidth, height: remoteHeight };
		const scale = Math.min(
			containerSize.width / remoteWidth,
			containerSize.height / remoteHeight,
		);
		return {
			width: Math.max(1, Math.floor(remoteWidth * scale)),
			height: Math.max(1, Math.floor(remoteHeight * scale)),
		};
	}, [containerSize.height, containerSize.width, remoteHeight, remoteWidth]);

	useEffect(() => {
		if (!latestFrame || !canvasRef.current) return;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");
		if (!context) return;
		const image = new Image();
		image.onload = () => {
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			context.drawImage(image, 0, 0);
		};
		image.src = `data:image/jpeg;base64,${latestFrame}`;
	}, [latestFrame]);

	const toRemoteCoords = useCallback(
		(clientX: number, clientY: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: clientX, y: clientY };
			const rect = canvas.getBoundingClientRect();
			return {
				x: Math.max(
					0,
					Math.min(
						(clientX - rect.left) * (remoteWidth / rect.width),
						remoteWidth,
					),
				),
				y: Math.max(
					0,
					Math.min(
						(clientY - rect.top) * (remoteHeight / rect.height),
						remoteHeight,
					),
				),
			};
		},
		[remoteHeight, remoteWidth],
	);

	// Drag detection: only send mouse-click for clean clicks; send
	// mouse-down/mouse-up only for real drags. Without this, mousedown+mouseup
	// fires an implicit browser click AND the explicit mouse-click event fires
	// another one — causing every click to register twice on the remote page.
	const dragDownPosRef = useRef<{ x: number; y: number } | null>(null);
	const isDraggingRef = useRef(false);
	const DRAG_THRESHOLD_PX = 5;

	const handleMouseDown = useCallback(
		(event: React.MouseEvent) => {
			onUserInput?.();
			const point = toRemoteCoords(event.clientX, event.clientY);
			dragDownPosRef.current = point;
			isDraggingRef.current = false;
			// Don't send yet — wait to see if this is a drag or a clean click.
		},
		[onUserInput, toRemoteCoords],
	);
	const handleMouseUp = useCallback(
		(event: React.MouseEvent) => {
			onUserInput?.();
			const point = toRemoteCoords(event.clientX, event.clientY);
			if (isDraggingRef.current) {
				sendEvent({ type: "mouse-up", ...point, button: getMouseButton(event) });
			}
			isDraggingRef.current = false;
			dragDownPosRef.current = null;
		},
		[onUserInput, sendEvent, toRemoteCoords],
	);
	const handleClick = useCallback(
		(event: React.MouseEvent) => {
			onUserInput?.();
			if (isDraggingRef.current) {
				isDraggingRef.current = false;
				return;
			}
			const point = toRemoteCoords(event.clientX, event.clientY);
			sendEvent({ type: "mouse-click", ...point, button: getMouseButton(event) });
		},
		[onUserInput, sendEvent, toRemoteCoords],
	);
	const lastMoveTime = useRef(0);
	const handleMouseMove = useCallback(
		(event: React.MouseEvent) => {
			const now = Date.now();
			if (now - lastMoveTime.current < 32) return;
			lastMoveTime.current = now;
			const point = toRemoteCoords(event.clientX, event.clientY);

			// Start drag if mouse moved past threshold from down position
			if (dragDownPosRef.current && !isDraggingRef.current) {
				const dx = Math.abs(point.x - dragDownPosRef.current.x);
				const dy = Math.abs(point.y - dragDownPosRef.current.y);
				if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
					isDraggingRef.current = true;
					sendEvent({ type: "mouse-down", ...dragDownPosRef.current, button: "left" });
				}
			}

			sendEvent({ type: "mouse-move", ...point });
		},
		[sendEvent, toRemoteCoords],
	);
	const handleWheel = useCallback(
		(event: React.WheelEvent) => {
			onUserInput?.();
			event.preventDefault();
			sendEvent({
				type: "wheel",
				...toRemoteCoords(event.clientX, event.clientY),
				deltaX: event.deltaX,
				deltaY: event.deltaY,
			});
		},
		[onUserInput, sendEvent, toRemoteCoords],
	);
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			onUserInput?.();
			const preventDefault = [
				"Tab",
				"Enter",
				"Escape",
				"Backspace",
				"Delete",
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"Home",
				"End",
				"PageUp",
				"PageDown",
			];
			if (
				preventDefault.includes(event.key) ||
				event.ctrlKey ||
				event.metaKey
			)
				event.preventDefault();
			if (event.key.length === 1 && !event.ctrlKey && !event.metaKey)
				sendEvent({ type: "type-text", text: event.key });
			else
				sendEvent({
					type: "key",
					key: event.key,
					code: event.code,
					modifiers: {
						alt: event.altKey,
						ctrl: event.ctrlKey,
						meta: event.metaKey,
						shift: event.shiftKey,
					},
				});
		},
		[onUserInput, sendEvent],
	);

	const isConnected = connectionState === "connected";
	return (
		<div
			ref={containerRef}
			className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-canvas p-4"
			style={{ cursor: isConnected ? "crosshair" : "default" }}
		>
			<div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(54,199,176,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(54,199,176,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
			{connectionState === "idle" && (
				<div className="relative max-w-sm text-center">
					<div className="mb-3 font-semibold text-ink text-sm">
						Remote Browser
					</div>
					<p className="text-muted text-sm leading-6">
						Enter a URL above to start a secure remote browser
						session.
					</p>
				</div>
			)}
			{connectionState === "connecting" && (
				<div className="relative flex items-center gap-3 text-muted text-sm">
					<span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
					Connecting to browser
				</div>
			)}
			{connectionState === "error" && (
				<div className="relative rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-danger text-sm">
					Connection failed. Restart the browser session.
				</div>
			)}
			<canvas
				ref={canvasRef}
				tabIndex={0}
				className="relative block max-h-full max-w-full rounded-sm bg-black shadow-2xl shadow-black/50 outline-none ring-1 ring-white/10"
				style={{
					display: isConnected || latestFrame ? "block" : "none",
					width: fittedCanvasSize.width,
					height: fittedCanvasSize.height,
					objectFit: "contain",
				}}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onClick={handleClick}
				onMouseMove={handleMouseMove}
				onContextMenu={(event) => event.preventDefault()}
				onWheel={handleWheel}
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
};
