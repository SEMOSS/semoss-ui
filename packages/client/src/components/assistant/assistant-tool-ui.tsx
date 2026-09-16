import { useCallback, useEffect, useRef, useState } from "react";
import type { MCPToolRequest } from "@semoss/sdk";
import { Env, usePixel } from "@semoss/sdk/react";
import { Skeleton } from "@semoss/ui/next";
import { isCompleteStatus } from "@/components/assistant/assistant-tools";
import type { BuildTool } from "@/stores/assistant";
import { getToolAppId, PLATFORM_URL } from "@/utility/mcp-utils";

type RawRecord = Record<string, unknown>;
const asRecord = (v: unknown): RawRecord =>
	v && typeof v === "object" ? (v as RawRecord) : {};

interface AssistantToolUiProps {
	/** The tool invocation whose opted-in UI (if any) should render */
	tool: BuildTool;
	/** Room the tool ran in, forwarded to the loaded page via SMSS_INIT_TOOL */
	roomId: string;
}

/**
 * Renders a tool's opted-in UI (`_meta.SMSS_MCP_UI`) inline as an iframe, then
 * posts the tool's parameters/response into it via the same `SMSS_INIT_TOOL`
 * postMessage contract the playground uses. Some tools' real work only happens
 * client-side on that page (e.g. reporting-insights' create_dashboard), so
 * without this they'd return a link the user has to open by hand for anything
 * to actually happen.
 *
 * @name AssistantToolUi
 * @param tool - The tool invocation whose opted-in UI (if any) should render.
 * @param roomId - Room the tool ran in, forwarded via SMSS_INIT_TOOL.
 * @return The tool's iframe UI, or null when it didn't opt into one.
 */
export const AssistantToolUi: React.FC<AssistantToolUiProps> = ({
	tool,
	roomId,
}) => {
	const meta = tool.metadata ?? {};
	const ui = asRecord(meta.SMSS_MCP_UI);
	const resourceURI =
		typeof ui.resourceURI === "string" ? ui.resourceURI : "";
	const autoOpen = Boolean(ui.autoOpen);
	const displayLocation =
		typeof ui.displayLocation === "string" ? ui.displayLocation : "inline";
	const app = getToolAppId(meta);

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const iframeReadyRef = useRef(false);
	const [isLoading, setIsLoading] = useState(true);
	const [url, setUrl] = useState("");

	const engineType =
		typeof meta.SMSS_ENGINE_TYPE === "string"
			? meta.SMSS_ENGINE_TYPE
			: undefined;
	const isProjectType = !engineType || engineType === "PROJECT";
	const getAppInfo = usePixel<{
		project_type?: "BLOCKS" | "CODE" | "INSIGHT" | "";
	}>(
		app && resourceURI
			? isProjectType
				? `ProjectInfo(project=["${app}"]);`
				: `EngineInfo(engine=["${app}"]);`
			: "",
		{ data: { project_type: "" } },
	);

	// The durable backend uses "success" for a completed tool call while the live
	// stream uses "COMPLETED" — isCompleteStatus normalizes both so directUrl (with
	// params like target_project already baked in) isn't skipped for one of them.
	const toolResponse = isCompleteStatus(tool.status)
		? tool.output
		: undefined;

	// Most reporting-insights-style UI tools return their own fully-formed url
	// (with every real param, e.g. target_project, already baked in) in their
	// JSON output. Prefer that directly over reconstructing a generic
	// resourceURI-based path and relying on the postMessage handoff below,
	// which only carries the response over AFTER the iframe has already
	// started loading a param-less URL — too racy for params that matter.
	let directUrl = "";
	if (toolResponse) {
		try {
			const parsed = JSON.parse(toolResponse) as RawRecord;
			if (typeof parsed.url === "string") directUrl = parsed.url;
		} catch {
			/* not JSON — fall back to the resourceURI path below */
		}
	}

	const sendToolContext = useCallback(() => {
		const targetOrigin = url
			? new URL(url, window.location.origin).origin
			: window.location.origin;
		iframeRef.current?.contentWindow?.postMessage(
			{
				type: "SMSS_INIT_TOOL",
				tool: {
					type: "MCP",
					message: "",
					id: tool.id,
					name: tool.name,
					parameters: tool.arguments ?? {},
					roomId,
					original_name: tool.name,
					tool_response: toolResponse,
					executedParameters: tool.arguments ?? {},
					_meta: meta,
				} satisfies MCPToolRequest,
			},
			targetOrigin,
		);
	}, [url, tool.id, tool.name, tool.arguments, roomId, toolResponse, meta]);

	const handleOnLoad = () => {
		iframeReadyRef.current = true;
		sendToolContext();
	};

	useEffect(() => {
		if (directUrl) {
			setUrl(directUrl);
			setIsLoading(false);
			return;
		}
		// Auto-executing tools resolve almost immediately; keep the loading state
		// until we know whether a direct url is coming, rather than racing ahead
		// to the param-less resourceURI path.
		if (!isCompleteStatus(tool.status)) {
			setIsLoading(true);
			return;
		}
		if (!app || !resourceURI) {
			setUrl("");
			setIsLoading(false);
			return;
		}
		if (
			getAppInfo.status === "INITIAL" ||
			getAppInfo.status === "LOADING"
		) {
			return;
		}
		if (getAppInfo.status === "ERROR") {
			setUrl("");
			setIsLoading(false);
			return;
		}
		setUrl(
			getAppInfo.data.project_type === "BLOCKS"
				? `${PLATFORM_URL}/#/s/${app}${resourceURI}`
				: `${Env.MODULE}/public_home/${app}/portals${resourceURI}`,
		);
		setIsLoading(false);
	}, [
		directUrl,
		tool.status,
		app,
		resourceURI,
		getAppInfo.status,
		getAppInfo.data,
	]);

	useEffect(() => {
		if (iframeReadyRef.current) {
			sendToolContext();
		}
	}, [sendToolContext]);

	if (!resourceURI || !autoOpen || displayLocation === "hidden") {
		return null;
	}

	return (
		<div className="relative h-96 w-full overflow-hidden rounded-md border border-border">
			{isLoading && <Skeleton className="h-full w-full" />}
			{url && !isLoading ? (
				<iframe
					ref={iframeRef}
					className="h-full w-full border-none"
					title={tool.title || tool.name}
					src={url}
					onLoad={handleOnLoad}
				/>
			) : null}
		</div>
	);
};
