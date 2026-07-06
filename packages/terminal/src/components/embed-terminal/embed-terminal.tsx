import { useEffect } from "react";
import { useInsight } from "@semoss/sdk/react";
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
 * Entry shell. In the AngularJS original this directive opened a fresh insight
 * via `semossCoreService.emit('open', {...})` that ran:
 *
 *     AddSheet("0"); AddPanel(panel=[0], sheet=["0"]);
 *     Panel(0) | SetPanelView("terminal");
 *
 * With the React SDK we already get a ready Insight from <InsightProvider> +
 * <LoginPage> (which gates on auth/initialization), so by the time we mount
 * the insight is ready to use. We still fire the legacy Pixel sequence as a
 * background side-effect so any backend listeners keyed off SetPanelView keep
 * working — but we don't block the UI on it.
 */
export const EmbedTerminal = ({
	location = "panel",
	allowMultipleTerminals = true,
}: EmbedTerminalProps) => {
	const { isReady, actions } = useInsight();

	useEffect(() => {
		if (!isReady) return;
		// fire-and-forget: don't block the UI on this; the new React Terminal
		// doesn't depend on the panel having been seeded server-side
		(actions as { run: (p: string) => Promise<unknown> })
			.run(
				`AddSheet("0");
AddPanel(panel=[0], sheet=["0"]);
Panel(0) | SetPanelView("terminal");`,
			)
			.catch(() => {
				/* legacy compatibility hook — ignore failures */
			});
	}, [isReady, actions]);

	if (!isReady) return null;

	return (
		<TerminalProvider location={location}>
			<Terminal allowMultipleTerminals={allowMultipleTerminals} />
		</TerminalProvider>
	);
};
