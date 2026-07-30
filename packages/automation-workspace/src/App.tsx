import { Loader2, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { Button } from "@semoss/ui/next";
import { StatusBadge } from "./components/status-badge";
import type {
	AutomationDocument,
	AutomationGraph,
} from "./domain/automation.types";
import { getDisplayMeta } from "./domain/automation-display";
import { useAutomationRun } from "./hooks/use-automation-run";
import {
	getMcpToolContext,
	initSemoss,
	subscribeToMcpToolContext,
} from "./semoss/client";
import type { AutomationToolContext } from "./types/automation-tool.types";

const EMPTY_GRAPH: AutomationGraph = { nodes: [], edges: [] };

function useQueryParams(): URLSearchParams {
	return useMemo(() => new URLSearchParams(window.location.search), []);
}

/**
 * The Automation Workspace's single UI — a "system app" in the same sense as
 * `@semoss/playwright-browser-sockets`: it renders identically whether embedded directly by
 * the client app (`?app=<id>`) or iframed as the `TriggerAutomation` MCP tool's sidebar UI
 * (`system://automation-workspace/`, resolved by playground's ToolsView and fed context via
 * the `SMSS_INIT_TOOL` postMessage handshake).
 */
export default function App() {
	const params = useQueryParams();
	const [toolContext, setToolContext] =
		useState<AutomationToolContext | null>(getMcpToolContext());
	const [ready, setReady] = useState(false);

	useEffect(() => {
		initSemoss().finally(() => setReady(true));
		return subscribeToMcpToolContext(setToolContext);
	}, []);

	const appId = params.get("app") || toolContext?.projectId || "";
	const readOnly = params.get("readOnly") === "1";

	const { data: automationDoc, status: automationStatus } =
		usePixel<AutomationDocument | null>(
			appId ? `GetAutomation(project=["${appId}"]);` : "",
			{ data: null },
		);

	const { running, nodeStates, summary, error, run } = useAutomationRun();

	const loading =
		!ready ||
		automationStatus === "INITIAL" ||
		automationStatus === "LOADING";
	const steps = (automationDoc?.graph ?? EMPTY_GRAPH).nodes;

	if (!appId) {
		return (
			<div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground text-sm">
				No automation app was specified.
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto flex h-full max-w-3xl flex-col gap-4 overflow-auto px-6 py-6">
			<div className="flex items-center justify-between">
				<span className="font-semibold text-lg">Automation Steps</span>
				{!readOnly ? (
					<Button
						data-testid="automation-workspace-run-button"
						disabled={running || steps.length === 0}
						onClick={() => run(appId, steps)}
					>
						{running ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Play className="mr-2 h-4 w-4" />
						)}
						{running ? "Running…" : "Run"}
					</Button>
				) : null}
			</div>

			{steps.length === 0 ? (
				<div className="rounded-2xl border border-dashed bg-card/60 px-6 py-10 text-center text-muted-foreground text-sm">
					This automation has no steps yet.
				</div>
			) : (
				<ol className="flex flex-col gap-2">
					{steps.map((step, index) => {
						const meta = getDisplayMeta(step.type);
						const Icon = meta.icon;
						const liveState = nodeStates.find(
							(n) => n.nodeId === step.id,
						);
						return (
							<li
								key={step.id}
								className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
							>
								<span className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground text-xs">
									{index + 1}
								</span>
								<span
									className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted ${meta.color}`}
								>
									<Icon className="h-4 w-4" />
								</span>
								<span className="flex flex-1 flex-col">
									<span className="font-medium text-sm">
										{step.label || meta.label}
									</span>
									<span className="text-muted-foreground text-xs">
										{meta.label}
									</span>
								</span>
								{liveState ? (
									<StatusBadge status={liveState.status} />
								) : null}
							</li>
						);
					})}
				</ol>
			)}

			{summary ? (
				<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-700 text-sm">
					{summary}
				</div>
			) : null}
			{error ? (
				<div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive text-sm">
					{error}
				</div>
			) : null}
		</div>
	);
}
