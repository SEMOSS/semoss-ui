import {
	createContext,
	type PropsWithChildren,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

/**
 * Context value interface for managing iframe positioning and activation across child components.
 * Consolidates all frame state (refs, src, position) per iframeKey for simplified state management.
 */
interface IframeContextValue {
	/** Ref to map of active child refs, keyed by iframeKey */
	activeFrameMapRef: RefObject<Map<string, RefObject<HTMLDivElement>>>;
	/** Map of complete frame state (ref, src, position data) keyed by iframeKey */
	frameMapState: Map<
		string,
		{
			activeRef: RefObject<HTMLDivElement> | null;
			src: string;
			left: number;
			top: number;
			width: number;
			height: number;
		}
	>;
	/** Activate a child component (stores ref and calculates position) */
	activate: (
		iframeKey: string,
		targetRef: RefObject<HTMLDivElement>,
		src: string,
	) => void;
	/** Handle child component unmount */
	onUnmount: (
		iframeKey: string,
		targetRef: RefObject<HTMLDivElement>,
	) => void;
}

export const IframeContext = createContext<IframeContextValue | null>(null);

/**
 * Provider component that manages iframe positioning across child components.
 * Consolidates frame state (ref, src, position) per iframeKey and renders InnerComponents.
 *
 * @param {ReactNode} props.children - Child components that use useIframeContext
 * @component
 */
export const IframeProvider = ({ children }: PropsWithChildren) => {
	/**
	 * State
	 */
	/** Ref to map of active child refs keyed by iframeKey */
	const activeFrameMapRef = useRef<Map<string, RefObject<HTMLDivElement>>>(
		new Map(),
	);
	/** Complete frame state per iframeKey (ref, src, and position data). activeRef is null when child is inactive. */
	const [frameMapState, setFrameMapState] = useState<
		Map<
			string,
			{
				activeRef: RefObject<HTMLDivElement>;
				src: string;
				left: number;
				top: number;
				width: number;
				height: number;
			}
		>
	>(new Map());
	/** Reference to the container for relative positioning calculations */
	const containerRef = useRef<HTMLDivElement>(null);
	/** Ref to track previous bounds to detect actual resize/move events */
	const previousBoundsRef = useRef<
		Map<
			string,
			{ width: number; height: number; left: number; top: number }
		>
	>(new Map());
	/** Map of cleanup timeouts, keyed by iframeKey */
	const cleanupTimeouts = useRef<Map<string, number>>(new Map());

	/**
	 * Functions
	 */

	/**
	 * Update frame state: position, ref, and src for an iframeKey.
	 * If targetRef is provided, calculates position relative to container.
	 * If targetRef is null, sets position to 0x0 (hidden).
	 * @param iframeKey - The iframeKey to update
	 * @param targetRef - The child element (null if unmounting)
	 * @param src - The src URL (optional, only updates if provided)
	 */
	const updateFrameState = useCallback(
		(
			iframeKey: string,
			targetRef: RefObject<HTMLDivElement> | null,
			src?: string,
		) => {
			if (targetRef?.current && containerRef.current) {
				const rect = targetRef.current.getBoundingClientRect();
				const containerRect =
					containerRef.current.getBoundingClientRect();
				setFrameMapState((prev) => {
					const newPositions = new Map(prev);
					newPositions.set(iframeKey, {
						activeRef: targetRef,
						left: rect.left - containerRect.left,
						top: rect.top - containerRect.top,
						width: rect.width,
						height: rect.height,
						src: src ?? newPositions.get(iframeKey)?.src,
					});
					return newPositions;
				});
			} else {
				setFrameMapState((prev) => {
					const newPositions = new Map(prev);
					newPositions.set(iframeKey, {
						activeRef: null,
						left: 0,
						top: 0,
						width: 0,
						height: 0,
						src: src ?? newPositions.get(iframeKey)?.src,
					});
					return newPositions;
				});
			}
		},
		[],
	);

	/**
	 * Activate a child component: store its ref, calculate position, and update frame state.
	 * @param iframeKey - The unique key of the child to activate
	 * @param targetRef - The DOM reference of the child element
	 * @param src - The src URL this child will display
	 */
	const activate = useCallback(
		(
			iframeKey: string,
			targetRef: RefObject<HTMLDivElement>,
			src: string,
		) => {
			// Clear any pending cleanup timeout for this key
			const existingTimeout = cleanupTimeouts.current.get(iframeKey);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
				cleanupTimeouts.current.delete(iframeKey);
			}

			activeFrameMapRef.current.set(iframeKey, targetRef);
			updateFrameState(iframeKey, targetRef, src);
		},
		[updateFrameState],
	);

	/**
	 * Handle child unmount: if the unmounting child is active, hide its iframe.
	 * Only cleans up if the unmounting ref matches the active ref for this iframeKey.
	 * @param iframeKey - The child's unique key
	 * @param targetRef - The DOM reference of the unmounting child
	 */
	const onUnmount = useCallback(
		(iframeKey: string, targetRef: RefObject<HTMLDivElement>) => {
			if (targetRef !== activeFrameMapRef.current.get(iframeKey)) {
				return;
			}

			activeFrameMapRef.current.delete(iframeKey);
			updateFrameState(iframeKey, null);

			// Start cleanup timer: delete this key's data after 3 seconds if not reactivated
			const timeout = setTimeout(() => {
				setFrameMapState((prev) => {
					const newMap = new Map(prev);
					newMap.delete(iframeKey);
					return newMap;
				});
				cleanupTimeouts.current.delete(iframeKey);
			}, 120000);

			cleanupTimeouts.current.set(iframeKey, timeout);
		},
		[updateFrameState],
	);

	/**
	 * Effects
	 */

	/**
	 * Clean up all pending timeouts when provider unmounts
	 */
	useEffect(() => {
		return () => {
			cleanupTimeouts.current.forEach((timeout) => {
				clearTimeout(timeout);
			});
			cleanupTimeouts.current.clear();
		};
	}, []);

	/**
	 * Observe active child elements for size/layout changes and recalculate positions.
	 * Ensures iframes stay positioned correctly when child containers resize or move.
	 */
	useEffect(() => {
		const observers: Map<string, ResizeObserver> = new Map();

		// Helper to check and update bounds if they changed
		const checkAndUpdateBounds = (
			iframeKey: string,
			ref: React.RefObject<HTMLDivElement>,
			posState: {
				activeRef: RefObject<HTMLDivElement> | null;
				src: string;
				left: number;
				top: number;
				width: number;
				height: number;
			},
		) => {
			if (
				!ref.current ||
				!containerRef.current ||
				ref !== activeFrameMapRef.current.get(iframeKey)
			)
				return;

			const rect = ref.current.getBoundingClientRect();
			const containerRect = containerRef.current.getBoundingClientRect();
			const prev = previousBoundsRef.current.get(iframeKey);

			const left = rect.left - containerRect.left;
			const top = rect.top - containerRect.top;

			// Only update if size or position actually changed
			if (!prev) {
				previousBoundsRef.current.set(iframeKey, {
					width: rect.width,
					height: rect.height,
					left,
					top,
				});
			} else if (
				prev.width !== rect.width ||
				prev.height !== rect.height ||
				prev.left !== left ||
				prev.top !== top
			) {
				previousBoundsRef.current.set(iframeKey, {
					width: rect.width,
					height: rect.height,
					left,
					top,
				});
				updateFrameState(iframeKey, ref, posState.src);
			}
		};

		frameMapState.forEach((posState, iframeKey) => {
			const ref = posState.activeRef;
			if (!ref?.current) return;

			const resizeObserver = new ResizeObserver(() => {
				checkAndUpdateBounds(iframeKey, ref, posState);
			});

			resizeObserver.observe(ref.current);
			observers.set(iframeKey, resizeObserver);
		});

		// Watch for DOM changes in the container (sibling layout changes)
		const mutationObserver = new MutationObserver(() => {
			frameMapState.forEach((posState, iframeKey) => {
				const ref = posState.activeRef;
				if (!ref?.current) return;
				checkAndUpdateBounds(iframeKey, ref, posState);
			});
		});

		if (containerRef.current) {
			mutationObserver.observe(containerRef.current, {
				childList: true,
				subtree: true,
				attributes: true,
			});
		}

		return () => {
			observers.forEach((observer) => {
				observer.disconnect();
			});
			mutationObserver.disconnect();
		};
	}, [frameMapState, updateFrameState]);

	return (
		<IframeContext.Provider
			value={{ activeFrameMapRef, frameMapState, activate, onUnmount }}
		>
			<div ref={containerRef} className="relative">
				{children}
				{Array.from(frameMapState.entries()).map(
					([iframeKey, frameState]) => (
						<div
							className="absolute"
							style={{
								left: `${frameState.left}px`,
								top: `${frameState.top}px`,
								width: `${frameState.width}px`,
								height: `${frameState.height}px`,
							}}
							key={iframeKey}
						>
							<iframe
								width="100%"
								height="100%"
								src={frameState.src}
								title={frameState.src}
							/>
						</div>
					),
				)}
			</div>
		</IframeContext.Provider>
	);
};
