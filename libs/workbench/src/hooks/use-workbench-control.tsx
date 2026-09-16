import { type ComponentType, useEffect, useRef, useState } from "react";
import type { WorkbenchPanelId, WorkbenchPanelProps } from "../types";
import { useWorkbench } from "./use-workbench";

/**
 * Register this panel's chrome control with the nearest workbench for the
 * lifetime of the calling component. The chrome draws the control beside the
 * active tab of the panel's stack — one control per panel, visible only while
 * the panel is the front tab.
 *
 * `content` is handed the panel's id and nothing else, and draws in the
 * chrome's subtree rather than the panel's — so it does NOT re-render when the
 * panel does. It reads its own panel with `useWorkbenchPanel<P, V>(id)`, which
 * subscribes it directly, and the `value` it finds there is whatever the panel
 * published with `setValue`.
 *
 * The hook holds the latest renderer in a ref — a stale closure never draws,
 * and the registered wrapper keeps one identity so registration never churns.
 * So pass a stable component from its own file. An inline arrow is only
 * correct when the control's output is constant — it also takes a new identity
 * every render, which remounts the control on the chrome's next render,
 * resetting an open popover or focus inside it.
 *
 * @name useWorkbenchControl
 * @param pid - The panel instance the control belongs to.
 * @param content - The control renderer; it owns its own label, disabled
 * state, and click handling. Pass null to register nothing.
 */
export const useWorkbenchControl = (
	pid: WorkbenchPanelId,
	content: ComponentType<WorkbenchPanelProps> | null,
): void => {
	const registerControl = useWorkbench(
		(state) => state.control.actions.registerControl,
	);

	// the latest renderer, so the wrapper never draws a stale closure
	const contentRef = useRef(content);
	contentRef.current = content;

	// one wrapper per hook instance — the registered identity never changes
	const [Stable] = useState(
		(): ComponentType<WorkbenchPanelProps> =>
			function WorkbenchControlContent(props: WorkbenchPanelProps) {
				const Latest = contentRef.current;
				return Latest ? <Latest {...props} /> : null;
			},
	);

	const hasContent = Boolean(content);
	useEffect(() => {
		if (!hasContent) {
			return;
		}
		return registerControl(pid, { content: Stable });
	}, [registerControl, pid, hasContent, Stable]);
};
