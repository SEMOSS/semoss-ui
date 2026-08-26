import { type ComponentType, useEffect, useRef, useState } from "react";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelId,
} from "@/stores/workbench";
import { useWorkbench } from "./use-workbench";

/**
 * Register this panel's chrome control with the nearest workbench for the
 * lifetime of the calling component. The chrome draws the control beside the
 * active tab of the panel's stack — one control per panel, visible only while
 * the panel is the front tab.
 *
 * `content` may be an inline component: it renders with the panel's own chrome
 * props and its latest closures (so it can reach the panel's refs and state),
 * while the chrome keeps rendering one stable wrapper — an inline definition
 * getting a new identity every render never remounts the control.
 *
 * @name useWorkbenchControl
 * @param pid - The panel instance the control belongs to.
 * @param content - The control renderer; it owns its own label, disabled
 * state, and click handling. Pass null to register nothing.
 */
export const useWorkbenchControl = (
	pid: WorkbenchPanelId,
	content: ComponentType<WorkbenchChromeProps> | null,
): void => {
	const registerControl = useWorkbench(
		(state) => state.control.actions.registerControl,
	);

	// the latest renderer, so the wrapper never draws a stale closure
	const contentRef = useRef(content);
	contentRef.current = content;

	// one wrapper per hook instance — the registered identity never changes
	const [Stable] = useState(
		(): ComponentType<WorkbenchChromeProps> =>
			function WorkbenchControlContent(props: WorkbenchChromeProps) {
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
