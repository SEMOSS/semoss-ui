import { type ComponentType, useEffect, useRef, useState } from "react";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelId,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { useWorkbench } from "./use-workbench";

/**
 * Register this panel's chrome control with the nearest workbench for the
 * lifetime of the calling component. The chrome draws the control beside the
 * active tab of the panel's stack — one control per panel, visible only while
 * the panel is the front tab.
 *
 * `content` draws in the chrome's subtree, not the panel's, so it does NOT
 * re-render when the panel does. The hook holds the latest renderer in a ref —
 * a stale closure never draws, and the registered wrapper keeps one identity
 * so registration never churns — but refreshing a ref schedules nothing, and
 * the chrome only reads it when it re-renders for its own reasons.
 *
 * So pass a stable component from its own file, subscribing to whatever live
 * state it shows (domain hooks work: the chrome is under the same provider),
 * and reaching the panel's own state through the `value`/`config` it is handed.
 * An inline arrow is only correct when the control's output is constant — it
 * also takes a new identity every render, which remounts the control on the
 * chrome's next render, resetting an open popover or focus inside it.
 *
 * `P`/`V` are inferred from `content`'s annotation, so a control typed
 * `FC<WorkbenchChromeProps<MyConfig, MyValue>>` reads them without a cast.
 *
 * @name useWorkbenchControl
 * @param pid - The panel instance the control belongs to.
 * @param content - The control renderer; it owns its own label, disabled
 * state, and click handling. Pass null to register nothing.
 */
export const useWorkbenchControl = <P = WorkbenchPanelParams, V = unknown>(
	pid: WorkbenchPanelId,
	content: ComponentType<WorkbenchChromeProps<P, V>> | null,
): void => {
	const registerControl = useWorkbench(
		(state) => state.control.actions.registerControl,
	);

	// the latest renderer, so the wrapper never draws a stale closure
	const contentRef = useRef(content);
	contentRef.current = content;

	// one wrapper per hook instance — the registered identity never changes
	const [Stable] = useState(
		(): ComponentType<WorkbenchChromeProps<P, V>> =>
			function WorkbenchControlContent(
				props: WorkbenchChromeProps<P, V>,
			) {
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
