import { BookOpen } from "lucide-react";
import { createElement } from "react";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { ThreadContextPanel } from "./thread-context-panel";
import { useWorkThread } from "./work-thread-context";

/** The same thread context remains live when its tab moves or hides. */
export function WorkContextDockPanel() {
	const { contextPanel } = useWorkThread();
	return <ThreadContextPanel {...contextPanel} />;
}
export const WORK_CONTEXT_PANEL: WorkbenchPanelConfig = {
	name: "Context",
	icon: ({ className }) =>
		createElement(BookOpen, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	content: WorkContextDockPanel,
};
