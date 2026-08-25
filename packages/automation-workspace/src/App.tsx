import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@semoss/ui/next";
import { AutomationCanvas } from "./components/canvas-editor/automation-canvas";
import { HistoryTab } from "./components/canvas-editor/tabs/history-tab";
import { InspectorTab } from "./components/canvas-editor/tabs/inspector-tab";
import {
	type AutomationTraceSnapshot,
	TraceTab,
} from "./components/canvas-editor/tabs/trace-tab";
import type { AutomationToolContext } from "./domain/automation.types";
import type {
	AutomationInspectorAction,
	AutomationInspectorSnapshot,
} from "./domain/automation-inspector";
import {
	getMcpToolContext,
	initSemoss,
	insight,
	subscribeToMcpToolContext,
} from "./semoss/client";

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
	const rawMode = params.get("mode");
	const parentOrigin = params.get("parentOrigin") || window.location.origin;
	const rawReadOnly = params.get("readOnly");
	const readOnly = rawReadOnly === "1" || rawReadOnly === "true";
	const mcpMode: "edit" | "create" | null =
		rawMode === "edit" || rawMode === "create" ? rawMode : null;
	const traceMode = rawMode === "trace";
	const inspectorMode = rawMode === "inspector";
	const historyMode = rawMode === "history";

	const { setTheme } = useTheme();
	useEffect(() => {
		const handleThemeSync = (event: MessageEvent<unknown>) => {
			if (
				event.origin !== parentOrigin ||
				typeof event.data !== "object" ||
				event.data === null
			) {
				return;
			}
			const msg = event.data as { type?: unknown; theme?: unknown };
			if (
				msg.type === "SEMOSS_THEME_SYNC" &&
				(msg.theme === "light" || msg.theme === "dark")
			) {
				setTheme(msg.theme);
			}
		};
		window.addEventListener("message", handleThemeSync);
		return () => window.removeEventListener("message", handleThemeSync);
	}, [parentOrigin, setTheme]);

	const [toolContext, setToolContext] =
		useState<AutomationToolContext | null>(getMcpToolContext());
	const [ready, setReady] = useState(false);
	const [createdProjectId, setCreatedProjectId] = useState<string | null>(
		null,
	);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);

	useEffect(() => {
		initSemoss().finally(() => setReady(true));
		return subscribeToMcpToolContext(setToolContext);
	}, []);

	// In create mode the project doesn't exist yet — create it once toolContext and
	// the insight session are both ready, then use the returned ID as the appId.
	useEffect(() => {
		if (
			mcpMode !== "create" ||
			!ready ||
			!toolContext ||
			createdProjectId ||
			creating
		)
			return;
		const projectName = toolContext.parameters?.projectName as
			| string
			| undefined;
		if (!projectName?.trim()) return;
		// Validate before injecting into the pixel string — only letters, numbers, spaces; must start with a letter.
		const cleanName = projectName.trim().replace(/[^a-zA-Z0-9 ]/g, "");
		if (!cleanName || !/^[a-zA-Z]/.test(cleanName)) {
			setCreateError(
				"Project name must start with a letter and contain only letters, numbers, and spaces.",
			);
			return;
		}
		setCreating(true);
		void insight.actions
			.run(
				`CreateAutomation(projectName=${JSON.stringify([cleanName])});`,
			)
			.then((result) => {
				const projectId = (
					result.pixelReturn?.[0]?.output as {
						project_id?: string;
					} | null
				)?.project_id;
				if (projectId) {
					setCreatedProjectId(projectId);
				} else {
					setCreateError(
						"Project was created but no ID was returned.",
					);
				}
			})
			.catch((err: Error) => {
				setCreateError(
					err.message ?? "Failed to create automation project.",
				);
			})
			.finally(() => setCreating(false));
	}, [mcpMode, ready, toolContext, createdProjectId, creating]);

	const appId =
		params.get("app") || createdProjectId || toolContext?.projectId || "";

	const [traceSnapshot, setTraceSnapshot] =
		useState<AutomationTraceSnapshot | null>(null);
	const [expandedTraceNodes, setExpandedTraceNodes] = useState<Set<string>>(
		new Set(),
	);
	const [inspectorSnapshot, setInspectorSnapshot] =
		useState<AutomationInspectorSnapshot | null>(null);
	const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

	useEffect(() => {
		if (!historyMode) return;
		const handleHistoryRefresh = (event: MessageEvent<unknown>) => {
			if (
				event.source !== window.parent ||
				event.origin !== parentOrigin ||
				typeof event.data !== "object" ||
				event.data === null
			) {
				return;
			}
			const message = event.data as { type?: unknown };
			if (message.type === "SEMOSS_AUTOMATION_HISTORY_REFRESH") {
				setHistoryRefreshToken((token) => token + 1);
			}
		};
		window.addEventListener("message", handleHistoryRefresh);
		return () =>
			window.removeEventListener("message", handleHistoryRefresh);
	}, [historyMode, parentOrigin]);

	useEffect(() => {
		if (!inspectorMode) return;
		const handleInspector = (event: MessageEvent<unknown>) => {
			if (
				event.source !== window.parent ||
				event.origin !== parentOrigin ||
				typeof event.data !== "object" ||
				event.data === null
			) {
				return;
			}
			const message = event.data as {
				type?: unknown;
				snapshot?: AutomationInspectorSnapshot | null;
			};
			if (message.type === "SEMOSS_AUTOMATION_INSPECTOR") {
				setInspectorSnapshot(message.snapshot ?? null);
			}
		};
		window.addEventListener("message", handleInspector);
		window.parent.postMessage(
			{ type: "SEMOSS_AUTOMATION_INSPECTOR_READY" },
			parentOrigin,
		);
		return () => window.removeEventListener("message", handleInspector);
	}, [inspectorMode, parentOrigin]);

	useEffect(() => {
		if (!traceMode) return;
		const handleTrace = (event: MessageEvent<unknown>) => {
			if (
				event.source !== window.parent ||
				event.origin !== parentOrigin ||
				typeof event.data !== "object" ||
				event.data === null
			) {
				return;
			}
			const message = event.data as {
				type?: unknown;
				snapshot?: AutomationTraceSnapshot;
			};
			if (
				message.type === "SEMOSS_AUTOMATION_TRACE" &&
				message.snapshot
			) {
				setTraceSnapshot(message.snapshot);
			}
		};
		window.addEventListener("message", handleTrace);
		window.parent.postMessage(
			{ type: "SEMOSS_AUTOMATION_TRACE_READY" },
			parentOrigin,
		);
		return () => window.removeEventListener("message", handleTrace);
	}, [parentOrigin, traceMode]);

	useEffect(() => {
		if (!createError || !toolContext) return;
		window.parent.postMessage(
			{
				type: "SMSS_EXEC_TOOL",
				tool: {
					type: "MCP",
					id: toolContext.id,
					name: toolContext.name,
					message: toolContext.message,
					roomId: toolContext.roomId,
					response: createError,
					tool_status: "error",
					executedParameters: toolContext.parameters,
				},
			},
			window.location.origin,
		);
	}, [createError, toolContext]);

	if (
		mcpMode === "create" &&
		(creating || (!createdProjectId && !createError))
	) {
		return (
			<div className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm">
				<Loader2 className="h-5 w-5 animate-spin" />
				Creating automation…
			</div>
		);
	}

	if (mcpMode === "create" && createError) {
		return (
			<div className="flex h-full items-center justify-center px-6 text-center text-destructive text-sm">
				{createError}
			</div>
		);
	}

	if (!appId) {
		return (
			<div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground text-sm">
				No automation app was specified.
			</div>
		);
	}

	if (ready) {
		if (historyMode) {
			return (
				<HistoryTab appId={appId} refreshToken={historyRefreshToken} />
			);
		}
		if (inspectorMode) {
			const snapshot = inspectorSnapshot;
			if (readOnly) {
				const step = snapshot?.editingStep;
				if (!step) {
					return (
						<div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground text-sm">
							Select a step on the canvas to inspect it.
						</div>
					);
				}
				return (
					<div className="h-full overflow-y-auto p-4">
						<p className="font-semibold text-sm">{step.label}</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{step.workflowType ?? step.type}
						</p>
						<pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 font-mono text-xs">
							{JSON.stringify(
								step.workflowConfig ?? step.config ?? {},
								null,
								2,
							)}
						</pre>
					</div>
				);
			}
			const sendInspectorAction = (action: AutomationInspectorAction) => {
				window.parent.postMessage(
					{ type: "SEMOSS_AUTOMATION_INSPECTOR_ACTION", action },
					parentOrigin,
				);
			};
			return (
				<InspectorTab
					appId={appId}
					description={snapshot?.description ?? ""}
					devMode={snapshot?.devMode ?? false}
					editingStep={snapshot?.editingStep ?? null}
					upstreamVars={snapshot?.upstreamVars ?? []}
					stepRunStatus={snapshot?.stepRunStatus}
					stepRunError={snapshot?.stepRunError}
					stepRunOutput={snapshot?.stepRunOutput}
					onDescriptionChange={(description) => {
						setInspectorSnapshot((current) =>
							current ? { ...current, description } : current,
						);
						sendInspectorAction({
							type: "update-description",
							description,
						});
					}}
					onClose={() => sendInspectorAction({ type: "close" })}
					onUpdate={(step) => {
						setInspectorSnapshot((current) =>
							current
								? { ...current, editingStep: step }
								: current,
						);
						sendInspectorAction({ type: "update-step", step });
					}}
					onDelete={(stepId) => {
						setInspectorSnapshot((current) =>
							current
								? { ...current, editingStep: null }
								: current,
						);
						sendInspectorAction({ type: "delete-step", stepId });
					}}
				/>
			);
		}
		if (traceMode) {
			const snapshot = traceSnapshot;
			if (!snapshot) {
				return (
					<div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground text-sm">
						Run the automation to view its trace.
					</div>
				);
			}
			return (
				<TraceTab
					{...snapshot}
					expandedNodes={expandedTraceNodes}
					onDismiss={() => undefined}
					onToggleNode={(nodeId) =>
						setExpandedTraceNodes((nodes) => {
							const next = new Set(nodes);
							if (next.has(nodeId)) next.delete(nodeId);
							else next.add(nodeId);
							return next;
						})
					}
				/>
			);
		}
		return (
			<AutomationCanvas
				appId={appId}
				readOnly={readOnly}
				mcpMode={mcpMode}
				mcpContext={toolContext ?? undefined}
			/>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	);
}
