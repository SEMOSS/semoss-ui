import { XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Env, usePixel } from "@semoss/sdk/react";
import { Badge, Button, Skeleton } from "@semoss/ui/next";
import type { ToolResponseDetails } from "./message-bubble";

const PLATFORM_URL =
	(
		import.meta as ImportMeta & {
			env?: { VITE_PLATFORM_URL?: string };
		}
	).env?.VITE_PLATFORM_URL || "";

function debugToolSidebar(label: string, data: unknown) {
	console.log(`[chat-tool-sidebar] ${label}`, data);
}

interface McpToolFrameProps {
	tool: ToolResponseDetails;
	projectId: string;
	resourceUri?: string;
}

interface ProjectToolDefinition {
	name: string;
	original_name?: string;
	title?: string;
	_meta?: {
		SMSS_MCP_UI?: { resourceURI?: string; [key: string]: unknown };
		SMSS_ENGINE_TYPE?: string;
		[key: string]: unknown;
	};
}

function normalizeToolIdentifier(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function useProjectToolDefinition(projectId: string | undefined) {
	return usePixel<{ tools: ProjectToolDefinition[] }>(
		projectId ? `GetMCPTools(project=["${projectId}"]);` : "",
		{
			data: { tools: [] },
		},
	);
}

function McpToolFrame({ tool, projectId, resourceUri }: McpToolFrameProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [url, setUrl] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	const getAppInfo = usePixel<{
		project_type?: "BLOCKS" | "CODE" | "INSIGHT" | "";
	}>(projectId ? `ProjectInfo(project=["${projectId}"]);` : "", {
		data: { project_type: "" },
	});

	useEffect(() => {
		const chooseUrl = async () => {
			debugToolSidebar("mcp-frame-input", {
				projectId,
				resourceUri,
				messageId: tool.messageId,
				toolId: tool.id,
				toolName: tool.name,
				originalName: tool.originalName,
				roomId: tool.roomId,
			});

			if (
				getAppInfo.status === "INITIAL" ||
				getAppInfo.status === "LOADING"
			) {
				return;
			}

			if (!projectId || getAppInfo.status === "ERROR") {
				setUrl("");
				setIsLoading(false);
				debugToolSidebar("mcp-frame-url-cleared", {
					reason: "missing-project-or-projectinfo-error",
					projectId,
					projectInfoStatus: getAppInfo.status,
				});
				return;
			}

			setIsLoading(true);

			if (!resourceUri) {
				if (getAppInfo.data.project_type === "BLOCKS") {
					const blocksUrl = `${PLATFORM_URL}/#/s/${projectId}/`;
					setUrl(blocksUrl);
					debugToolSidebar("mcp-frame-url-selected", {
						mode: "legacy-blocks",
						projectType: getAppInfo.data.project_type,
						url: blocksUrl,
					});
				}

				let foundPortals = false;
				try {
					const response = await fetch(
						`${Env.MODULE}/public_home/${projectId}/portals/`,
						{ method: "GET" },
					);
					const text = await response.text();
					foundPortals =
						response.status === 200 &&
						Boolean(text) &&
						text !==
							"Publish is not enabled on this project or there was an error publishing this project";
				} catch (_error) {
					foundPortals = false;
				}

				const nextUrl = foundPortals
					? `${Env.MODULE}/public_home/${projectId}/portals/`
					: "";
				setUrl(nextUrl);
				setIsLoading(false);
				debugToolSidebar("mcp-frame-url-selected", {
					mode: "legacy-portals-check",
					projectType: getAppInfo.data.project_type,
					url: nextUrl,
					foundPortals,
				});
				return;
			}

			if (
				resourceUri.startsWith("http://") ||
				resourceUri.startsWith("https://")
			) {
				setUrl(resourceUri);
				setIsLoading(false);
				debugToolSidebar("mcp-frame-url-selected", {
					mode: "absolute",
					url: resourceUri,
				});
				return;
			}

			if (getAppInfo.data.project_type === "BLOCKS") {
				const nextUrl = `${PLATFORM_URL}/#/s/${projectId}${resourceUri}`;
				setUrl(nextUrl);
				setIsLoading(false);
				debugToolSidebar("mcp-frame-url-selected", {
					mode: "blocks",
					projectType: getAppInfo.data.project_type,
					url: nextUrl,
				});
				return;
			}

			const nextUrl = `${Env.MODULE}/public_home/${projectId}/portals${resourceUri}`;
			setUrl(nextUrl);
			setIsLoading(false);
			debugToolSidebar("mcp-frame-url-selected", {
				mode: "portals",
				projectType: getAppInfo.data.project_type,
				url: nextUrl,
			});
		};

		void chooseUrl();
	}, [
		projectId,
		resourceUri,
		getAppInfo.status,
		getAppInfo.data.project_type,
		tool.id,
		tool.messageId,
		tool.name,
		tool.originalName,
		tool.roomId,
	]);

	const loading =
		getAppInfo.status === "INITIAL" ||
		getAppInfo.status === "LOADING" ||
		isLoading;

	const handleOnLoad = () => {
		if (!url) {
			return;
		}

		const targetOrigin = new URL(url, window.location.origin).origin;
		debugToolSidebar("mcp-frame-postmessage", {
			targetOrigin,
			url,
			toolId: tool.id,
			toolName: tool.name,
			originalName: tool.originalName,
			messageId: tool.messageId,
			roomId: tool.roomId,
		});
		iframeRef.current?.contentWindow?.postMessage(
			{
				type: "SMSS_INIT_TOOL",
				tool: {
					type: "MCP",
					message: tool.messageId || "",
					id: tool.id,
					name: tool.name,
					original_name: tool.originalName || "",
					parameters: tool.arguments || {},
					roomId: tool.roomId || "",
					executedParameters: tool.arguments || {},
					tool_response: tool.output,
				},
			},
			targetOrigin,
		);
	};

	if (loading) {
		return <Skeleton className="h-full w-full" />;
	}

	if (!url) {
		return null;
	}

	return (
		<iframe
			ref={iframeRef}
			title={`${tool.name} UI`}
			src={url}
			onLoad={handleOnLoad}
			className="h-full w-full border-none"
		/>
	);
}

export interface ToolResponseSidebarProps {
	tool: ToolResponseDetails;
	onClose?: () => void;
	showCloseButton?: boolean;
}

/**
 * Layout-mounted right panel for tool details, matching playground's
 * resizable sidebar flow instead of a modal overlay.
 */
export function ToolResponseSidebar({
	tool,
	onClose,
	showCloseButton = true,
}: ToolResponseSidebarProps) {
	const projectId = tool._meta?.SMSS_PROJECT_ID;
	const getMcpTools = useProjectToolDefinition(projectId);
	const toolIdentifiers = [tool.originalName, tool.title, tool.name].filter(
		(value): value is string =>
			typeof value === "string" && value.length > 0,
	);
	const matchedTool = getMcpTools.data.tools.find((candidate) => {
		const candidateIdentifiers = [
			candidate.name,
			candidate.original_name,
			candidate.title,
		].filter(
			(value): value is string =>
				typeof value === "string" && value.length > 0,
		);
		return candidateIdentifiers.some((identifier) => {
			const normalizedCandidate = normalizeToolIdentifier(identifier);
			return toolIdentifiers.some(
				(toolIdentifier) =>
					normalizeToolIdentifier(toolIdentifier) ===
					normalizedCandidate,
			);
		});
	});
	const resourceUri =
		typeof matchedTool?._meta?.SMSS_MCP_UI?.resourceURI === "string"
			? matchedTool._meta.SMSS_MCP_UI.resourceURI
			: typeof tool._meta?.SMSS_MCP_UI === "object" &&
					tool._meta.SMSS_MCP_UI &&
					typeof tool._meta.SMSS_MCP_UI.resourceURI === "string"
				? tool._meta.SMSS_MCP_UI.resourceURI
				: undefined;
	const canRenderMcpFrame = !!projectId;

	useEffect(() => {
		debugToolSidebar("sidebar-tool-payload", {
			toolId: tool.id,
			name: tool.name,
			originalName: tool.originalName,
			title: tool.title,
			messageId: tool.messageId,
			roomId: tool.roomId,
			meta: tool._meta,
		});
	}, [
		tool.id,
		tool.name,
		tool.originalName,
		tool.title,
		tool.messageId,
		tool.roomId,
		tool._meta,
	]);

	useEffect(() => {
		debugToolSidebar("sidebar-mcp-tools-response", {
			projectId,
			status: getMcpTools.status,
			count: getMcpTools.data.tools.length,
			tools: getMcpTools.data.tools.map((candidate) => ({
				name: candidate.name,
				original_name: candidate.original_name,
				title: candidate.title,
				resourceURI: candidate._meta?.SMSS_MCP_UI?.resourceURI,
			})),
		});
	}, [projectId, getMcpTools.status, getMcpTools.data.tools]);

	useEffect(() => {
		debugToolSidebar("sidebar-resource-selection", {
			projectId,
			canRenderMcpFrame,
			selectedResourceUri: resourceUri,
			matchedTool: matchedTool
				? {
						name: matchedTool.name,
						original_name: matchedTool.original_name,
						title: matchedTool.title,
						resourceURI:
							matchedTool._meta?.SMSS_MCP_UI?.resourceURI,
					}
				: null,
			fallbackFromMessageMeta:
				typeof tool._meta?.SMSS_MCP_UI === "object" &&
				tool._meta.SMSS_MCP_UI &&
				typeof tool._meta.SMSS_MCP_UI.resourceURI === "string"
					? tool._meta.SMSS_MCP_UI.resourceURI
					: null,
		});
	}, [canRenderMcpFrame, matchedTool, projectId, resourceUri, tool._meta]);

	return (
		<div
			data-slot="tool-response-sidebar"
			className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-card"
		>
			<div className="flex items-center gap-2 border-border border-b px-4 py-3">
				<div className="min-w-0 flex-1">
					<div className="font-semibold text-base">Tool Response</div>
					<div className="truncate text-muted-foreground text-sm">
						Viewing {tool.name}
					</div>
				</div>
				<Badge variant="outline">{tool.status}</Badge>
				{showCloseButton && onClose ? (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						aria-label="Close tool response sidebar"
					>
						<XIcon className="size-4" />
					</Button>
				) : null}
			</div>
			{canRenderMcpFrame && projectId ? (
				<div className="min-h-0 flex-1 overflow-hidden">
					<McpToolFrame
						tool={tool}
						projectId={projectId}
						resourceUri={resourceUri}
					/>
				</div>
			) : (
				<div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
					<div>
						<div className="mb-1 text-muted-foreground text-xs">
							Parameters
						</div>
						<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
							{JSON.stringify(tool.arguments ?? {}, null, 2)}
						</pre>
					</div>
					{tool.output !== undefined && (
						<div>
							<div className="mb-1 text-muted-foreground text-xs">
								Result
							</div>
							<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
								{tool.output}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
