import type React from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import {
	Alert,
	AlertDescription,
	Muted,
	Slider,
	Small,
	Spinner,
} from "@semoss/ui/next";
import type {
	BrowserScrollMetrics,
	ClientToServerEvent,
	ConnectionState,
	SelectionBounds,
} from "../types/browserEvents";

interface BrowserViewerProps {
	connectionState: ConnectionState;
	remoteWidth: number;
	remoteHeight: number;
	latestFrame: string | null;
	scrollMetrics: BrowserScrollMetrics;
	browserCursor?: string;
	sendEvent: (event: ClientToServerEvent) => void;
	onUserInput?: () => void;
	onTextDragComplete?: (
		bounds: SelectionBounds,
		anchor: { clientX: number; clientY: number },
	) => void;
	/** When true, clicks are delegated to onAutomationClick for acknowledged dispatch. */
	automationMode?: boolean;
	/** Called for an automation click with local and remote browser coordinates. */
	onAutomationClick?: (
		localX: number,
		localY: number,
		remoteX: number,
		remoteY: number,
		button: "left" | "right" | "middle",
	) => void;
}

function getMouseButton(event: React.MouseEvent): "left" | "right" | "middle" {
	return event.button === 2
		? "right"
		: event.button === 1
			? "middle"
			: "left";
}

/** Maps browser cursor names to the equivalent Tailwind cursor utility. */
function browserCursorClass(cursor: string): string {
	const cursors: Record<string, string> = {
		auto: "cursor-auto",
		default: "cursor-default",
		pointer: "cursor-pointer",
		text: "cursor-text",
		wait: "cursor-wait",
		progress: "cursor-progress",
		move: "cursor-move",
		"not-allowed": "cursor-not-allowed",
		grab: "cursor-grab",
		grabbing: "cursor-grabbing",
		"zoom-in": "cursor-zoom-in",
		"zoom-out": "cursor-zoom-out",
		"col-resize": "cursor-col-resize",
		"row-resize": "cursor-row-resize",
		"n-resize": "cursor-n-resize",
		"e-resize": "cursor-e-resize",
		"s-resize": "cursor-s-resize",
		"w-resize": "cursor-w-resize",
	};
	return cursors[cursor] ?? "cursor-default";
}

export const BrowserViewer: React.FC<BrowserViewerProps> = ({
	connectionState,
	remoteWidth,
	remoteHeight,
	latestFrame,
	scrollMetrics,
	browserCursor = "default",
	sendEvent,
	onUserInput,
	onTextDragComplete,
	automationMode = false,
	onAutomationClick,
}) => {
	const canvasId = useId();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const lastScrollbarDispatchRef = useRef(0);
	const optimisticScrollTopRef = useRef(0);
	const remoteScrollableHeight = Math.max(
		0,
		scrollMetrics.scrollHeight - scrollMetrics.viewportHeight,
	);

	useEffect(() => {
		optimisticScrollTopRef.current = scrollMetrics.scrollTop;
	}, [scrollMetrics.scrollTop]);

	const dispatchScrollbarTarget = useCallback(
		(target: number, force = false) => {
			if (remoteScrollableHeight <= 0) return;
			const now = Date.now();
			if (!force && now - lastScrollbarDispatchRef.current < 75) return;
			lastScrollbarDispatchRef.current = now;
			const clampedTarget = Math.max(
				0,
				Math.min(target, remoteScrollableHeight),
			);
			const delta = clampedTarget - optimisticScrollTopRef.current;
			if (Math.abs(delta) < 1) return;
			optimisticScrollTopRef.current = clampedTarget;
			onUserInput?.();
			sendEvent({
				type: "wheel",
				x: remoteWidth / 2,
				y: remoteHeight / 2,
				deltaX: 0,
				deltaY: delta,
			});
		},
		[
			onUserInput,
			remoteHeight,
			remoteScrollableHeight,
			remoteWidth,
			sendEvent,
		],
	);

	useEffect(() => {
		if (!latestFrame || !canvasRef.current) return;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");
		if (!context) return;
		const image = new Image();
		image.onload = () => {
			// Browser input coordinates use the Playwright viewport, which can
			// differ from the encoded frame size because of device scaling. Keep
			// the canvas in viewport coordinates and scale the frame into it so
			// its rendered bounds map exactly to backend mouse coordinates.
			canvas.width = remoteWidth || image.naturalWidth;
			canvas.height = remoteHeight || image.naturalHeight;
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
		};
		image.src = `data:image/jpeg;base64,${latestFrame}`;
	}, [latestFrame, remoteHeight, remoteWidth]);

	const toRemoteCoords = useCallback(
		(clientX: number, clientY: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: clientX, y: clientY };
			const rect = canvas.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };

			// object-contain can leave horizontal or vertical space inside the
			// canvas element. Map against the visible frame rather than the outer
			// element bounds; otherwise every pointer event includes that offset.
			const frameWidth = canvas.width || remoteWidth;
			const frameHeight = canvas.height || remoteHeight;
			const frameScale = Math.min(
				rect.width / frameWidth,
				rect.height / frameHeight,
			);
			const renderedWidth = frameWidth * frameScale;
			const renderedHeight = frameHeight * frameScale;
			const offsetX = (rect.width - renderedWidth) / 2;
			const offsetY = (rect.height - renderedHeight) / 2;
			return {
				x: Math.max(
					0,
					Math.min(
						(clientX - rect.left - offsetX) *
							(remoteWidth / renderedWidth),
						remoteWidth,
					),
				),
				y: Math.max(
					0,
					Math.min(
						(clientY - rect.top - offsetY) *
							(remoteHeight / renderedHeight),
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
	const suppressNextClickRef = useRef(false);
	const DRAG_THRESHOLD_PX = 5;

	const handleMouseDown = useCallback(
		(event: React.MouseEvent) => {
			onUserInput?.();
			suppressNextClickRef.current = false;
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
			const dragStart = dragDownPosRef.current;
			const wasDragging = isDraggingRef.current;
			if (wasDragging) {
				sendEvent({
					type: "mouse-up",
					...point,
					button: getMouseButton(event),
				});
				suppressNextClickRef.current = true;
				if (event.button === 0 && dragStart) {
					onTextDragComplete?.(
						{
							startX: dragStart.x,
							startY: dragStart.y,
							endX: point.x,
							endY: point.y,
						},
						{ clientX: event.clientX, clientY: event.clientY },
					);
				}
			}
			isDraggingRef.current = false;
			dragDownPosRef.current = null;
		},
		[onTextDragComplete, onUserInput, sendEvent, toRemoteCoords],
	);
	const handleClick = useCallback(
		(event: React.MouseEvent) => {
			// A browser click event is emitted after mouseup even when the gesture
			// was a drag. Ignore it completely: notifying onUserInput here would
			// immediately dismiss the selected-text popup created by mouseup.
			if (suppressNextClickRef.current) {
				suppressNextClickRef.current = false;
				return;
			}
			onUserInput?.();
			const point = toRemoteCoords(event.clientX, event.clientY);
			if (automationMode && onAutomationClick) {
				const canvas = canvasRef.current;
				const rect = canvas?.getBoundingClientRect();
				const localX = rect ? event.clientX - rect.left : event.clientX;
				const localY = rect ? event.clientY - rect.top : event.clientY;
				onAutomationClick(
					localX,
					localY,
					point.x,
					point.y,
					getMouseButton(event),
				);
				return;
			}
			sendEvent({
				type: "mouse-click",
				...point,
				button: getMouseButton(event),
			});
		},
		[
			automationMode,
			onAutomationClick,
			onUserInput,
			sendEvent,
			toRemoteCoords,
		],
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
					sendEvent({
						type: "mouse-down",
						...dragDownPosRef.current,
						button: "left",
					});
				}
			}

			sendEvent({ type: "mouse-move", ...point });
		},
		[sendEvent, toRemoteCoords],
	);
	const lastScrollTimeRef = useRef(0);
	const scrollViewport = useCallback(
		(direction: -1 | 1) => {
			onUserInput?.();
			sendEvent({
				type: "wheel",
				x: remoteWidth / 2,
				y: remoteHeight / 2,
				deltaX: 0,
				deltaY: direction * remoteHeight * 0.7,
			});
		},
		[onUserInput, remoteHeight, remoteWidth, sendEvent],
	);
	const handleWheel = useCallback(
		(event: React.WheelEvent) => {
			event.preventDefault();
			const now = Date.now();
			if (now - lastScrollTimeRef.current < 220 || event.deltaY === 0)
				return;
			lastScrollTimeRef.current = now;
			scrollViewport(event.deltaY < 0 ? -1 : 1);
		},
		[scrollViewport],
	);
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "ArrowUp" || event.key === "ArrowDown") {
				event.preventDefault();
				scrollViewport(event.key === "ArrowUp" ? -1 : 1);
				return;
			}
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
		[onUserInput, scrollViewport, sendEvent],
	);

	const isConnected = connectionState === "connected";
	return (
		<div className="relative flex min-w-0 flex-1 cursor-default items-center justify-center overflow-hidden bg-background p-4">
			{connectionState === "idle" && (
				<div className="relative max-w-sm text-center">
					<Small className="mb-3 text-foreground">
						Remote Browser
					</Small>
					<Muted className="leading-6">
						Enter a URL above to start a secure remote browser
						session.
					</Muted>
				</div>
			)}
			{connectionState === "connecting" && (
				<div className="relative flex items-center gap-3">
					<Spinner className="size-5" />
					<Muted>Connecting to browser</Muted>
				</div>
			)}
			{connectionState === "error" && (
				<Alert variant="destructive" className="relative w-auto">
					<AlertDescription>
						Connection failed. Restart the browser session.
					</AlertDescription>
				</Alert>
			)}
			<div
				className={`relative max-h-full min-h-0 min-w-0 max-w-full ${isConnected || latestFrame ? "flex" : "hidden"}`}
			>
				<canvas
					id={canvasId}
					ref={canvasRef}
					tabIndex={0}
					className={`relative block h-auto max-h-full w-auto max-w-full rounded-sm bg-background object-contain shadow-lg outline-none ring-1 ring-border ${
						automationMode && isConnected
							? "cursor-crosshair"
							: isConnected
								? browserCursorClass(browserCursor)
								: "cursor-default"
					}`}
					onMouseDown={handleMouseDown}
					onMouseUp={handleMouseUp}
					onClick={handleClick}
					onMouseMove={handleMouseMove}
					onContextMenu={(event) => event.preventDefault()}
					onWheel={handleWheel}
					onKeyDown={handleKeyDown}
				/>
				{isConnected && remoteScrollableHeight > 0 && (
					<Slider
						orientation="vertical"
						inverted
						min={0}
						max={remoteScrollableHeight}
						step={1}
						value={[
							Math.min(
								scrollMetrics.scrollTop,
								remoteScrollableHeight,
							),
						]}
						onValueChange={([value]) =>
							dispatchScrollbarTarget(value ?? 0)
						}
						onValueCommit={([value]) =>
							dispatchScrollbarTarget(value ?? 0, true)
						}
						aria-label="Remote page scrollbar"
						className="absolute inset-y-2 right-1 z-20 [&_[data-slot=slider-range]]:bg-muted-foreground [&_[data-slot=slider-thumb]]:border-muted-foreground [&_[data-slot=slider-thumb]]:bg-background"
					/>
				)}
			</div>
		</div>
	);
};
