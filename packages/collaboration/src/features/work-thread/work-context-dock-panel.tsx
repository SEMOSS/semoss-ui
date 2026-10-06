import { BookOpen } from "lucide-react";
import { createElement } from "react";
import {
	useWorkbenchControl,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { ThreadContextPanel } from "./thread-context-panel";
import { WorkPaneCloseControl } from "./work-pane-close-control";
import { useWorkThread } from "./work-thread-context";

/** The same thread context remains live when its tab moves or hides. */
function WorkContextDockPanel({ id }: WorkbenchPanelProps) {
	useWorkbenchControl(id, WorkPaneCloseControl);
	const { contextPanel } = useWorkThread();
	return <ThreadContextPanel {...contextPanel} />;
}
export const WORK_CONTEXT_PANEL: WorkbenchPanelConfig = {
	name: "Context",
	icon: ({ className }) =>
		createElement(BookOpen, { className, "aria-hidden": true }),
	canRename: false,
	canClose: false,
	mount: "keepAlive",
	content: WorkContextDockPanel,
};
