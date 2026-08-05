import { TerminalConsolePanel } from "@semoss/terminal";

interface WorkspaceTerminalProps {
	appId: string;
	/**
	 * Forwarded from the terminal panel: the insightId of the active terminal
	 * tab. The code workspace passes `workspace.setActiveTerminalInsightId`
	 * here so the "Insight" file explorer stays in sync with the terminal.
	 */
	onActiveInsightChange?: (insightId: string | null) => void;
}

/**
 * Multi-tab Pixel REPL for the workspace bottom panel. The tab logic lives in
 * `@semoss/terminal` (TerminalConsolePanel) so it's shared with other embedders;
 * each tab is its own app-scoped insight. The left sidebar's "Insight" tab
 * binds to the active tab's insight via `onActiveInsightChange` so its listing
 * matches what the terminal sees.
 *
 * The dock edges come from FlexLayout's splitters (now a crisp 1px line that is
 * also the resize handle — see flexlayout.css), so we don't add our own borders
 * that would sit a hair off from the splitter.
 */
export const WorkspaceTerminal = ({
	appId,
	onActiveInsightChange,
}: WorkspaceTerminalProps) => (
	<TerminalConsolePanel
		appId={appId}
		onActiveInsightChange={onActiveInsightChange}
	/>
);
