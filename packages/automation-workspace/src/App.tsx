import { Loader2, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { Button } from "@semoss/ui/next";
import { AutomationFormEditor } from "./components/form-editor/automation-form-editor";
import { OutputPreview } from "./components/form-editor/output-preview";
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
	insight,
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
	const rawMode = params.get("mode");
	const mcpMode: "edit" | "create" | null =
		rawMode === "edit" || rawMode === "create" ? rawMode : null;
	const readOnly = params.get("readOnly") === "1";

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
				`CreateProject(project=["${cleanName}"], projectType=["CODE"], global=[false]);`,
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

	const { data: automationDoc, status: automationStatus } =
		usePixel<AutomationDocument | null>(
			appId && ready ? `GetAutomation(project=["${appId}"]);` : "",
			{ data: null },
		);

	const { running, nodeStates, summary, llmContext, error, run } =
		useAutomationRun();
	const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(
		new Set(),
	);

	const loading =
		!ready ||
		automationStatus === "INITIAL" ||
		automationStatus === "LOADING";
	const steps = (automationDoc?.graph ?? EMPTY_GRAPH).nodes;
	const playgroundInputs =
		toolContext?.parameters?.inputs &&
		typeof toolContext.parameters.inputs === "object" &&
		!Array.isArray(toolContext.parameters.inputs)
			? (toolContext.parameters.inputs as Record<string, unknown>)
			: undefined;

	// When used as an MCP sidebar tool, postMessage back to the playground once the
	// run completes so the tool call is marked done and the LLM can continue.
	// playground/room-content.tsx listens for SMSS_EXEC_TOOL with the MCPToolResponse
	// nested under the "tool" key.
	// When project creation fails in create mode, notify the playground so the tool call is marked done.
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

	useEffect(() => {
		if (!toolContext || (!summary && !error)) return;
		window.parent.postMessage(
			{
				type: "SMSS_EXEC_TOOL",
				tool: {
					type: "MCP",
					id: toolContext.id,
					name: toolContext.name,
					message: toolContext.message,
					roomId: toolContext.roomId,
					response:
						llmContext ??
						summary ??
						error ??
						"Automation finished.",
					tool_status: summary ? "success" : "error",
					executedParameters: toolContext.parameters,
				},
			},
			window.location.origin,
		);
	}, [summary, error, llmContext, toolContext]);

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

	// MCP editor mode — opened by EditAutomation or CreateAutomation MCP tool
	if ((mcpMode === "edit" || mcpMode === "create") && ready && !readOnly) {
		return (
			<AutomationFormEditor
				appId={appId}
				mcpMode={mcpMode}
				mcpContext={toolContext ?? undefined}
			/>
		);
	}

	// Editor mode — full form editor (iframed by workspace.tsx without ?readOnly)
	if (!readOnly && ready) {
		return <AutomationFormEditor appId={appId} />;
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
				<Button
					data-testid="automation-workspace-run-button"
					disabled={running || steps.length === 0}
					onClick={() => run(appId, steps, playgroundInputs)}
				>
					{running ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Play className="mr-2 h-4 w-4" />
					)}
					{running ? "Running…" : "Run"}
				</Button>
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
						const outputForDisplay =
							liveState?.outputValue ?? liveState?.outputPreview;
						const hasOutput =
							liveState?.status === "SUCCESS" && outputForDisplay;
						const isExpanded = expandedOutputs.has(step.id);
						return (
							<li
								key={step.id}
								className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3"
							>
								<div className="flex items-center gap-3">
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
										<StatusBadge
											status={liveState.status}
										/>
									) : null}
								</div>
								{hasOutput && (
									<OutputPreview
										value={outputForDisplay as string}
										nodeType={step.type}
										expanded={isExpanded}
										onToggle={() =>
											setExpandedOutputs((prev) => {
												const next = new Set(prev);
												if (next.has(step.id))
													next.delete(step.id);
												else next.add(step.id);
												return next;
											})
										}
									/>
								)}
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
