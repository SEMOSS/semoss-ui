import { type RefObject, useContext, useEffect, useRef } from "react";
import { IframeContext } from "@/contexts";

/**
 * Hook to register and manage a child component for iframe display.
 * Automatically activates the child on mount and notifies on unmount.
 *
 * @param {string} iframeKey - Unique identifier for this child component
 * @param {string} src - The source URL this child will display
 * @param {() => void} onLoad - Optional callback when iframe loads
 * @returns {Object} Object containing:
 *   - targetRef: DOM reference to attach to the child container
 *   - isActive: Boolean indicating if this child's iframe is currently displayed
 *   - activate: Function to manually activate this child's iframe
 *   - iframeRef: Ref to the iframe element (stable per iframeKey)
 * @throws {Error} If used outside of IframeProvider
 */
export const useIframeContext = (
	iframeKey: string,
	src: string,
	onLoad?: () => void,
): {
	targetRef: RefObject<HTMLDivElement>;
	isActive: boolean;
	activate: () => void;
	iframeRef: RefObject<HTMLIFrameElement>;
} => {
	const context = useContext(IframeContext);
	const targetRef = useRef<HTMLDivElement>(null);
	const onLoadRef = useRef<(() => void) | undefined>(onLoad);

	// Keep onLoadRef in sync with the onLoad prop without triggering effects
	useEffect(() => {
		onLoadRef.current = onLoad;
	}, [onLoad]);

	if (!context) {
		throw new Error("useIframeContext must be used within IframeProvider");
	}

	// Check if this child is the active one for its iframeKey
	const isActive =
		context.frameMapState.get(iframeKey)?.activeRef === targetRef;

	/**
	 * Activate this child's iframe on mount
	 */
	useEffect(() => {
		context.activate(iframeKey, targetRef, src, onLoadRef.current);
	}, [context.activate, src, iframeKey]);

	/**
	 * Notify context when this child unmounts
	 */
	useEffect(() => {
		return () => context.onUnmount(iframeKey, targetRef);
	}, [context.onUnmount, iframeKey]);

	return {
		targetRef,
		isActive,
		activate: () => context.activate(iframeKey, targetRef, src, onLoad),
		iframeRef: context.iframeRefsMap.current.get(iframeKey),
	};
};
