import { TerminalConsolePanel } from "@semoss/terminal";

interface WorkspaceTerminalProps {
	appId: string;
}

/**
 * Multi-tab Pixel REPL for the workspace bottom panel. The tab logic lives in
 * `@semoss/terminal` (TerminalConsolePanel) so it's shared with other embedders;
 * each tab is its own app-scoped insight. The left sidebar's "Insight" tab
 * handles file browsing separately.
 *
 * The dock edges come from FlexLayout's splitters (now a crisp 1px line that is
 * also the resize handle — see flexlayout.css), so we don't add our own borders
 * that would sit a hair off from the splitter.
 */
export const WorkspaceTerminal = ({ appId }: WorkspaceTerminalProps) => (
	<TerminalConsolePanel appId={appId} />
);
