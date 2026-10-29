import { SquareTerminalIcon } from "lucide-react";
import { useCallback } from "react";
import { TerminalConsolePanel } from "@semoss/terminal";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbench, useWorkbenchControl } from "@semoss/workbench";
import { TerminalNewControl } from "./terminal-new-control";

/** The configuration used to retain the default Terminal N name. */
export interface TerminalConfig {
	terminalNumber?: number;
}

/** Props for {@link TerminalPanelContent}. */
export interface TerminalPanelContentProps extends WorkbenchPanelProps {
	/**
	 * The project the terminal runs in: its insight opens in that project and
	 * the console suggests the project's own reactors. Without one, the
	 * terminal runs in a plain insight.
	 */
	projectId?: string;
}

/**
 * One Pixel REPL session, owned by a single workbench terminal panel. The
 * panel's value is the session's insight id, which the Insight file explorer
 * follows.
 */
export const TerminalPanelContent = ({
	id,
	projectId,
}: TerminalPanelContentProps) => {
	// the action alone: the session must not re-render as the panel's record,
	// value, or visibility changes
	const setPanelValue = useWorkbench(
		(state) => state.layout.actions.setPanelValue,
	);
	const handleInsightChange = useCallback(
		(insightId: string | null) => setPanelValue(id, insightId),
		[setPanelValue, id],
	);

	useWorkbenchControl(id, TerminalNewControl);

	return (
		<TerminalConsolePanel
			appId={projectId}
			allowMultipleTerminals={false}
			onActiveInsightChange={handleInsightChange}
		/>
	);
};

/**
 * Blueprint for each terminal in a workbench with no project. keepAlive is
 * required because every workbench tab is an independent live REPL session.
 */
export const TERMINAL_PANEL: WorkbenchPanelConfig<
	TerminalConfig,
	string | null
> = {
	name: "Terminal",
	helpText: "Terminal",
	icon: ({ className }) => <SquareTerminalIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: TerminalPanelContent,
};
