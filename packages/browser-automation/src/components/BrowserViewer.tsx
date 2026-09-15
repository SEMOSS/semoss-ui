import type React from "react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { scrollDeltaForViewport } from "../domain/scroll";
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
	const containerRef = useRef<HTMLDivElement>(null);
	const scrollbarTrackRef = useRef<HTMLDivElement>(null);
	const scrollbarThumbRef = useRef<HTMLDivElement>(null);
	const scrollbarDragOffsetRef = useRef<number | null>(null);
	const lastScrollbarDispatchRef = useRef(0);
	const optimisticScrollTopRef = useRef(0);
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
	const remoteScrollableHeight = Math.max(
		0,
		scrollMetrics.scrollHeight - scrollMetrics.viewportHeight,
	);
	const scrollbarHeight = Math.max(1, fittedCanvasSize.height);
	const scrollbarThumbHeight = Math.min(
		scrollbarHeight,
		Math.max(
			28,
			scrollbarHeight *
				(scrollMetrics.viewportHeight /
					Math.max(1, scrollMetrics.scrollHeight)),
		),
	);
	const scrollbarTravel = Math.max(0, scrollbarHeight - scrollbarThumbHeight);
	const scrollbarThumbTop =
		remoteScrollableHeight > 0
			? (Math.min(scrollMetrics.scrollTop, remoteScrollableHeight) /
					remoteScrollableHeight) *
				scrollbarTravel
			: 0;

	useEffect(() => {
		if (scrollbarDragOffsetRef.current === null) {
			optimisticScrollTopRef.current = scrollMetrics.scrollTop;
		}
	}, [scrollMetrics.scrollTop]);

	const dispatchScrollbarTarget = useCallback(
		(target: number, localTop: number) => {
			if (remoteScrollableHeight <= 0) return;
			if (scrollbarThumbRef.current) {
				scrollbarThumbRef.current.style.transform = `translateY(${localTop}px)`;
			}
			const now = Date.now();
			if (now - lastScrollbarDispatchRef.current < 75) return;
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

	const updateScrollbarFromPointer = useCallback(
		(clientY: number) => {
			const track = scrollbarTrackRef.current;
			const dragOffset = scrollbarDragOffsetRef.current;
			if (!track || dragOffset === null || scrollbarTravel <= 0) return;
			const rect = track.getBoundingClientRect();
			const localTop = Math.max(
				0,
				Math.min(clientY - rect.top - dragOffset, scrollbarTravel),
			);
			dispatchScrollbarTarget(
				(localTop / scrollbarTravel) * remoteScrollableHeight,
				localTop,
			);
		},
		[dispatchScrollbarTarget, remoteScrollableHeight, scrollbarTravel],
	);

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
				deltaY: direction * scrollDeltaForViewport(remoteHeight),
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
		<div
			ref={containerRef}
			className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-canvas p-4"
			style={{ cursor: "default" }}
		>
			<div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(54,199,176,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(54,199,176,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
			{connectionState === "idle" && (
				<div className="relative max-w-sm text-center">
					<div className="mb-3 font-semibold text-ink text-sm">
						Remote Browser
					</div>
					<p className="text-ink-muted text-sm leading-6">
						Enter a URL above to start a secure remote browser
						session.
					</p>
				</div>
			)}
			{connectionState === "connecting" && (
				<div className="relative flex items-center gap-3 text-ink-muted text-sm">
					<span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
					Connecting to browser
				</div>
			)}
			{connectionState === "error" && (
				<div className="relative rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-danger text-sm">
					Connection failed. Restart the browser session.
				</div>
			)}
			<div
				className="relative max-h-full max-w-full"
				style={{
					display: isConnected || latestFrame ? "block" : "none",
					width: fittedCanvasSize.width,
					height: fittedCanvasSize.height,
				}}
			>
				<canvas
					id={canvasId}
					ref={canvasRef}
					tabIndex={0}
					className="relative block h-full w-full rounded-sm bg-black shadow-2xl shadow-black/50 outline-none ring-1 ring-white/10"
					style={{
						objectFit: "contain",
						cursor:
							automationMode && isConnected
								? "crosshair"
								: isConnected
									? browserCursor
									: "default",
					}}
					onMouseDown={handleMouseDown}
					onMouseUp={handleMouseUp}
					onClick={handleClick}
					onMouseMove={handleMouseMove}
					onContextMenu={(event) => event.preventDefault()}
					onWheel={handleWheel}
					onKeyDown={handleKeyDown}
				/>
				{isConnected && remoteScrollableHeight > 0 && (
					<div
						ref={scrollbarTrackRef}
						role="scrollbar"
						tabIndex={0}
						aria-controls={canvasId}
						aria-orientation="vertical"
						aria-valuemin={0}
						aria-valuemax={remoteScrollableHeight}
						aria-valuenow={Math.round(scrollMetrics.scrollTop)}
						aria-label="Remote page scrollbar"
						className="group absolute inset-y-0 right-0 z-20 h-full w-4 cursor-default touch-none select-none bg-slate-500/10 transition-colors hover:bg-slate-500/15 active:bg-slate-500/15"
						onPointerDown={(event) => {
							event.preventDefault();
							event.stopPropagation();
							event.currentTarget.setPointerCapture(
								event.pointerId,
							);
							const rect =
								event.currentTarget.getBoundingClientRect();
							const pointerTop = event.clientY - rect.top;
							const isOnThumb =
								pointerTop >= scrollbarThumbTop &&
								pointerTop <=
									scrollbarThumbTop + scrollbarThumbHeight;
							scrollbarDragOffsetRef.current = isOnThumb
								? pointerTop - scrollbarThumbTop
								: scrollbarThumbHeight / 2;
							updateScrollbarFromPointer(event.clientY);
						}}
						onPointerMove={(event) => {
							if (
								scrollbarDragOffsetRef.current === null ||
								!event.currentTarget.hasPointerCapture(
									event.pointerId,
								)
							)
								return;
							updateScrollbarFromPointer(event.clientY);
						}}
						onPointerUp={(event) => {
							updateScrollbarFromPointer(event.clientY);
							scrollbarDragOffsetRef.current = null;
							if (
								event.currentTarget.hasPointerCapture(
									event.pointerId,
								)
							) {
								event.currentTarget.releasePointerCapture(
									event.pointerId,
								);
							}
						}}
						onPointerCancel={() => {
							scrollbarDragOffsetRef.current = null;
						}}
						onKeyDown={(event) => {
							if (
								event.key === "ArrowUp" ||
								event.key === "ArrowDown"
							) {
								event.preventDefault();
								scrollViewport(
									event.key === "ArrowUp" ? -1 : 1,
								);
							} else if (
								event.key === "Home" ||
								event.key === "End"
							) {
								event.preventDefault();
								const localTop =
									event.key === "Home" ? 0 : scrollbarTravel;
								dispatchScrollbarTarget(
									event.key === "Home"
										? 0
										: remoteScrollableHeight,
									localTop,
								);
							}
						}}
					>
						<div
							ref={scrollbarThumbRef}
							className="absolute top-0 right-1 left-1 rounded-full bg-slate-400/55 shadow-sm transition-colors group-hover:bg-slate-500/80 group-active:bg-slate-500/80"
							style={{
								height: scrollbarThumbHeight,
								transform: `translateY(${scrollbarThumbTop}px)`,
							}}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
