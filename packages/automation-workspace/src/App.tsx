import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@semoss/ui/next";
import { AgentRunDialog } from "./components/agent-run";
import { AutomationCanvas } from "./components/canvas-editor/automation-canvas";
import type {
	AutomationNodeTrace,
	AutomationRunDetail,
	AutomationToolContext,
} from "./domain/automation.types";
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
 * The Automation Workspace's single UI — iframed as the `TriggerAutomation` MCP tool's sidebar
 * UI (`system://automation-workspace/`, resolved by playground's ToolsView and fed context via
 * the `SMSS_INIT_TOOL` postMessage handshake). `@semoss/client` renders `AutomationCanvas` and
 * its companion tabs (`InspectorTab`, `RunsTab`) directly as a normal package import instead of
 * iframing this app — see that package's `automation-workbench.tsx`.
 */
export default function App() {
	const params = useQueryParams();
	const rawMode = params.get("mode");
	const parentOrigin = params.get("parentOrigin") || window.location.origin;
	const rawReadOnly = params.get("readOnly");
	const readOnly = rawReadOnly === "1" || rawReadOnly === "true";
	const mcpMode: "edit" | "create" | "trigger" | null =
		rawMode === "edit" || rawMode === "create" || rawMode === "trigger"
			? rawMode
			: null;

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

	const [agentRunTrace, setAgentRunTrace] =
		useState<AutomationNodeTrace | null>(null);
	const [agentRunAutomationUpdate, setAgentRunAutomationUpdate] =
		useState<AutomationRunDetail | null>(null);

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
		return (
			<>
				<AutomationCanvas
					appId={appId}
					readOnly={readOnly}
					mcpMode={mcpMode}
					mcpContext={toolContext ?? undefined}
					onViewAgentRun={setAgentRunTrace}
					externalRunUpdate={agentRunAutomationUpdate}
				/>
				<AgentRunDialog
					open={agentRunTrace !== null}
					projectId={appId}
					trace={agentRunTrace}
					onAutomationRunUpdated={setAgentRunAutomationUpdate}
					onOpenChange={(open) => {
						if (!open) setAgentRunTrace(null);
					}}
				/>
			</>
		);
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	);
}
