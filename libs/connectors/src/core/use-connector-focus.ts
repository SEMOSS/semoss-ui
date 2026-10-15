import { type RefObject, useEffect, useRef } from "react";
import type { ConnectorFocusRequest } from "./connector.types";

/** Restore a requested row, or the list/recovery container when that row is gone. */
export const useConnectorFocus = (
	ref: RefObject<HTMLElement | null>,
	request: ConnectorFocusRequest | undefined,
	isVisible = true,
	isReady = true,
	fallbackRef?: RefObject<HTMLElement | null>,
): void => {
	const handledRef = useRef<ConnectorFocusRequest | undefined>(undefined);
	const itemKey = request?.itemKey;
	const requestId = request?.requestId;
	useEffect(() => {
		if (
			!isVisible ||
			!isReady ||
			itemKey === undefined ||
			requestId === undefined ||
			(itemKey === handledRef.current?.itemKey &&
				requestId === handledRef.current.requestId)
		)
			return;
		let frame: number | undefined;
		let attempts = 0;
		let isCancelled = false;
		const restoreFocus = (): void => {
			if (isCancelled) return;
			attempts += 1;
			const container = ref.current ?? fallbackRef?.current;
			if (container) {
				const row = Array.from(
					container.querySelectorAll<HTMLElement>("[data-item-key]"),
				).find((item) => item.dataset.itemKey === itemKey);
				const target = row ?? container;
				target.focus();
				if (target.ownerDocument.activeElement === target) {
					handledRef.current = { itemKey, requestId };
					return;
				}
			}
			// A retained dock host can stay hidden until its next layout frames.
			if (attempts < 3) frame = requestAnimationFrame(restoreFocus);
		};
		restoreFocus();
		return () => {
			isCancelled = true;
			if (frame !== undefined) cancelAnimationFrame(frame);
		};
	}, [ref, fallbackRef, itemKey, requestId, isVisible, isReady]);
};
