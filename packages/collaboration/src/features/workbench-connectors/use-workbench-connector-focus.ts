import { type RefObject, useEffect, useRef } from "react";
import { useWorkbenchEvent } from "@semoss/workbench";
import { CONNECTOR_DETAIL_FOCUS_EVENT } from "./workbench-connector-navigation.context";

/** The shared reader marks its item heading as a programmatic focus target. */
function focusItemHeading(root: HTMLElement): boolean {
	const heading = root.querySelector<HTMLElement>(
		"h1[tabindex='-1'],h2[tabindex='-1'],h3[tabindex='-1'],h4[tabindex='-1'],h5[tabindex='-1'],h6[tabindex='-1']",
	);
	if (!heading) return false;
	heading.focus();
	return true;
}

/** Focus newly opened or reselected details after their lazy viewer resolves. */
export function useWorkbenchConnectorFocus(
	id: string,
	isVisible: boolean,
	hasItemHeading: boolean,
): RefObject<HTMLElement | null> {
	const rootRef = useRef<HTMLElement>(null);
	useWorkbenchEvent<{ id: string }>(CONNECTOR_DETAIL_FOCUS_EVENT, (event) => {
		const root = rootRef.current;
		if (event.id === id && isVisible && root && !focusItemHeading(root))
			root.focus();
	});
	useEffect(() => {
		if (!isVisible) return;
		const root = rootRef.current;
		if (!root) return;
		const observer = new MutationObserver(() => {
			if (focusItemHeading(root)) observer.disconnect();
		});
		const frame = requestAnimationFrame(() => {
			if (focusItemHeading(root)) return;
			root.focus();
			if (hasItemHeading)
				observer.observe(root, { childList: true, subtree: true });
		});
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [isVisible, hasItemHeading]);
	return rootRef;
}
