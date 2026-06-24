import { useCallback, useRef, useState } from "react";
import { preloadNamespaces, useTranslation } from "@semoss/i18n";
import { InsightProvider } from "@semoss/sdk/react";
import { TerminalConsole, TerminalProvider } from "@semoss/terminal";

// Terminal i18n namespaces (file/console/dialog/chrome) are kept out of the
// client's initial load.
const TERMINAL_NS = ["console", "file", "chrome", "dialog"];

// This module only loads inside the lazy workspace chunk, so fetching the
// namespaces here pulls the terminal locale JSON alongside the terminal JS —
// not into the main bundle.
void preloadNamespaces(TERMINAL_NS);

// ── tab model ─────────────────────────────────────────────────────────────────

interface Tab {
	id: string;
	label: string;
}

const makeTab = (n: number): Tab => ({
	id: `wt-${Date.now()}-${n}`,
	label: `Terminal ${n}`,
});

// ── component ─────────────────────────────────────────────────────────────────

interface WorkspaceTerminalProps {
	appId: string;
}

/**
 * Multi-tab Pixel REPL for the workspace bottom panel.
 * Each tab has its own insight scoped to the current app — SetContext(appId)
 * fires automatically via InsightProvider options.app.
 * The left sidebar's "Insight" tab handles file browsing separately.
 */
export const WorkspaceTerminal = ({ appId }: WorkspaceTerminalProps) => {
	// Gate the render until the terminal namespaces are registered so the
	// console never paints raw i18n keys. They're in the already-loaded
	// locale chunk, so `ready` flips on the next tick — no visible delay.
	const { ready } = useTranslation(TERMINAL_NS);

	const counterRef = useRef(0);
	const nextTab = () => {
		counterRef.current += 1;
		return makeTab(counterRef.current);
	};

	const [tabs, setTabs] = useState<Tab[]>(() => [nextTab()]);
	const [activeId, setActiveId] = useState<string>(() => tabs[0].id);
	const [mountedIds, setMountedIds] = useState<Set<string>>(
		() => new Set([tabs[0].id]),
	);

	const addTab = useCallback(() => {
		const tab = nextTab();
		setTabs((prev) => [...prev, tab]);
		setActiveId(tab.id);
		setMountedIds((prev) => new Set([...prev, tab.id]));
	}, []);

	const closeTab = useCallback((id: string) => {
		setTabs((prev) => {
			if (prev.length <= 1) return prev;
			// Compute fallback inside the setter so it always reads live state
			setActiveId((activeId) => {
				if (activeId !== id) return activeId;
				const idx = prev.findIndex((t) => t.id === id);
				return (
					(
						prev[idx + 1] ??
						prev[idx - 1] ??
						prev.find((t) => t.id !== id)
					)?.id ?? activeId
				);
			});
			return prev.filter((t) => t.id !== id);
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
						<span className="truncate">{tab.label}</span>
						{tabs.length > 1 && (
							<button
								type="button"
								aria-label={`Close ${tab.label}`}
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
					title="New terminal tab"
					className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					+
				</button>
			</div>

			{/* Tab panes */}
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
							<InsightProvider options={{ app: appId }}>
								<TerminalProvider location="panel">
									<TerminalConsole projectId={appId} />
								</TerminalProvider>
							</InsightProvider>
						</div>
					);
				})}
			</div>
		</div>
	);
};
