import { type RefObject, useLayoutEffect, useState } from "react";

/** Below the existing md breakpoint, show one panel instead of squeezing the rail and stage. */
const COMPACT_WIDTH = 768;

/** Measure the dock itself, since the chat and navigation can narrow a desktop workbench. */
export function useWorkbenchCompactLayout(
	elementRef: RefObject<HTMLElement | null>,
	isOpen: boolean,
): boolean {
	const [isCompact, setIsCompact] = useState(false);
	useLayoutEffect(() => {
		const element = elementRef.current;
		if (!isOpen || !element) return;
		const updateWidth = (width: number): void => {
			// Hidden Activity trees report zero; retain the last visible layout.
			if (width > 0) setIsCompact(width < COMPACT_WIDTH);
		};
		updateWidth(element.getBoundingClientRect().width);
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === element)
					updateWidth(entry.contentRect.width);
			}
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [elementRef, isOpen]);
	return isCompact;
}
