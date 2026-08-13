import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AutomationCanvas } from "./components/canvas-editor/automation-canvas";
import type { AutomationToolContext } from "./domain/automation.types";
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
	const mcpMode: "edit" | "create" | null =
		rawMode === "edit" || rawMode === "create" ? rawMode : null;

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
			.run(`CreateAutomation(projectName=["${cleanName}"]);`)
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
			<AutomationCanvas
				appId={appId}
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
