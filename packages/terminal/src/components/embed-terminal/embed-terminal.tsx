import { Terminal } from "../terminal/terminal";
import { TerminalProvider } from "../terminal/terminal-context";

export interface EmbedTerminalProps {
	/**
	 * Where the terminal is mounted. Mirrors the legacy `location` binding.
	 * Defaults to "panel" so the workspace dock/close chrome stays hidden.
	 */
	location?: "workspace" | "panel" | "popup" | "pipeline";
	/**
	 * Allow opening more than one terminal tab. Set to `false` for a single
	 * fixed terminal. Defaults to `true`.
	 */
	allowMultipleTerminals?: boolean;
}

/**
 * Entry shell. The host gates on the SDK session (the standalone app through
 * `<LoginPage>`), and each terminal tab mounts its own insight, so the shell
 * needs no insight of its own.
 */
export const EmbedTerminal = ({
	location = "panel",
	allowMultipleTerminals = true,
}: EmbedTerminalProps) => (
	<TerminalProvider location={location}>
		<Terminal allowMultipleTerminals={allowMultipleTerminals} />
	</TerminalProvider>
);
