import { useCallback, useRef, useState } from "react";
import { preloadNamespaces, useTranslation } from "@semoss/i18n";
import { InsightProvider } from "@semoss/sdk/react";
import { TerminalProvider } from "../terminal/terminal-context";
import { TerminalConsole } from "../terminal-console/terminal-console";

// Namespaces this panel touches: "chrome" (tab labels — kept first so it's the
// default namespace for this component's t()) + "console" (the REPL, rendered
// by the child TerminalConsole). Embedders whose host app loads translations
// lazily (e.g. the client) won't have these at first paint — fetch them up
// front and gate the render below so no raw i18n keys flash. Idempotent if the
// host already loaded them.
const PANEL_NS = ["chrome", "console"];
void preloadNamespaces(PANEL_NS);

interface Tab {
	id: string;
	/** Display number; the label is derived from it at render time so it
	 *  re-localizes when the language changes. */
	n: number;
}

export interface TerminalConsolePanelProps {
	/**
	 * App/project to scope each terminal's insight + reactor catalog to. When
	 * set, every tab opens an app-scoped insight (SetContext runs via
	 * InsightProvider) and reactors are fetched for that project.
	 */
	appId?: string;
	/**
	 * Allow opening more than one terminal tab (a tab strip with +/×). Set to
	 * `false` for a single fixed console. Defaults to `true`.
	 */
	allowMultipleTerminals?: boolean;
}

const Session = ({ appId }: { appId?: string }) => (
	<InsightProvider options={appId ? { app: appId } : undefined}>
		<TerminalProvider location="panel">
			<TerminalConsole projectId={appId} />
		</TerminalProvider>
	</InsightProvider>
);

/**
 * Multi-tab console panel for a workspace bottom dock. Each tab is its own
 * independent session (own insight + transcript). Reuses the package's
 * TerminalConsole/TerminalProvider primitives — the only thing this adds is the
 * tab bar and keep-alive, so host apps don't reimplement it.
 */
export const TerminalConsolePanel = ({
	appId,
	allowMultipleTerminals = true,
}: TerminalConsolePanelProps) => {
	const { t, ready } = useTranslation(PANEL_NS);

	const counterRef = useRef(0);
	// Numbered "Terminal 1", "Terminal 2", … Any tab can be closed except the
	// last one (the × is hidden when a single tab remains). The number is stored
	// (not the label) so labels re-localize on language change.
	const makeTab = useCallback((): Tab => {
		counterRef.current += 1;
		return {
			id: `wt-${Date.now()}-${counterRef.current}`,
			n: counterRef.current,
		};
	}, []);

	const [tabs, setTabs] = useState<Tab[]>(() => [makeTab()]);
	const [activeId, setActiveId] = useState<string>(() => tabs[0].id);
	const [mountedIds, setMountedIds] = useState<Set<string>>(
		() => new Set([tabs[0].id]),
	);

	const addTab = useCallback(() => {
		const tab = makeTab();
		setTabs((prev) => [...prev, tab]);
		setActiveId(tab.id);
		setMountedIds((prev) => new Set([...prev, tab.id]));
	}, [makeTab]);

	const closeTab = useCallback((id: string) => {
		setTabs((prev) => {
			if (prev.length <= 1) return prev;
			// Compute the fallback inside the setter so it always reads live state
			setActiveId((activeId) => {
				if (activeId !== id) return activeId;
				const idx = prev.findIndex((tab) => tab.id === id);
				return (
					(
						prev[idx + 1] ??
						prev[idx - 1] ??
						prev.find((tab) => tab.id !== id)
					)?.id ?? activeId
				);
			});
			return prev.filter((tab) => tab.id !== id);
		});
	}, []);

	const switchTab = useCallback((id: string) => {
		setActiveId(id);
		setMountedIds((prev) => new Set([...prev, id]));
	}, []);

	// All hooks run above this point — safe to bail out once they have.
	if (!ready) {
		return null;
	}

	// Single-terminal mode: skip the tab bar entirely.
	if (!allowMultipleTerminals) {
		return (
			<div className="flex h-full flex-col overflow-hidden bg-background">
				<Session appId={appId} />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background">
			{/* Tab bar */}
			<div className="flex shrink-0 items-stretch overflow-x-auto border-border border-b bg-muted/60">
				{tabs.map((tab) => (
					<div
						key={tab.id}
						role="tab"
						tabIndex={0}
						aria-selected={tab.id === activeId}
						onClick={() => switchTab(tab.id)}
						onKeyDown={(e) =>
							e.key === "Enter" && switchTab(tab.id)
						}
						className={`group relative flex cursor-pointer select-none items-center gap-1.5 border-border border-r px-3 text-xs transition-colors ${
							tab.id === activeId
								? "bg-background text-foreground"
								: "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
						}`}
						style={{ minHeight: 28 }}
					>
						{tab.id === activeId && (
							<span
								aria-hidden="true"
								className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary"
							/>
						)}
						<span className="truncate">
							{t("tabs.terminal")} {tab.n}
						</span>
						{tabs.length > 1 && (
							<button
								type="button"
								aria-label={t("actions.closeTerminal")}
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									closeTab(tab.id);
								}}
								className="ml-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted-foreground/20 group-hover:opacity-100"
							>
								×
							</button>
						)}
					</div>
				))}

				<button
					type="button"
					onClick={addTab}
					title={t("tabs.newTerminal")}
					aria-label={t("tabs.newTerminal")}
					className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					+
				</button>
			</div>

			{/* Tab panes — kept mounted (hidden) so each session's state survives
			    tab switches. */}
			<div className="relative min-h-0 flex-1 overflow-hidden">
				{tabs.map((tab) => {
					if (!mountedIds.has(tab.id)) return null;
					const isActive = tab.id === activeId;

					return (
						<div
							key={tab.id}
							style={{
								position: "absolute",
								inset: 0,
								display: "flex",
								flexDirection: "column",
								visibility: isActive ? "visible" : "hidden",
								pointerEvents: isActive ? "auto" : "none",
							}}
						>
							<Session appId={appId} />
						</div>
					);
				})}
			</div>
		</div>
	);
};
