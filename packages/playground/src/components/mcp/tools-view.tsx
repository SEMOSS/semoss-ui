import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";
import { isRequestUserInputAction, parseUserInputRequest } from "@semoss/sdk";
import { Env, type MCPToolRequest, usePixel } from "@semoss/sdk/react";
import { isToolViewUri, useToolView } from "@semoss/shared";
import { AgentUserInputCard, Skeleton, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { ChatToolCard } from "@/features/chat-tools/components/chat-tool-card";
import {
	isChatToolCall,
	isFolderToolCall,
} from "@/features/chat-tools/tools/chat-tool-kind";
import { ComponentToolView } from "@/features/tool-views/component-tool-view";
import { decideAgentToolAction } from "@/stores/message/agent-harness";
import type { RoomStore } from "@/stores/room/room.store";
import { isAskExecutionMode } from "@/utility/mcp-utils";
import { ToolsDefaultView } from "./tools-default-view";
import { ToolsServerView } from "./tools-server-view";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

/**
 * A tool whose UI ships with the web app declares it as
 * `system://<package>/<path>` instead of pointing at a published project portal.
 * These load straight from a sibling package's build output, so there is no
 * project to look up and no `public_home` round trip.
 */
const SYSTEM_APP_URI = /^system:\/\/([a-zA-Z0-9._-]+)(\/.*)?$/;

/**
 * Resolves a `system://` resourceURI to a path relative to this app's own
 * build output. Returns null when the URI is not a system app URI.
 */
const resolveSystemAppUrl = (
	resourceURI: string | undefined,
): string | null => {
	if (!resourceURI) {
		return null;
	}
	const match = SYSTEM_APP_URI.exec(resourceURI);
	return match ? `../../${match[1]}/dist${match[2] ?? "/"}` : null;
};

interface ToolsViewProps {
	/** Room */
	room: RoomStore;

	/** Id of the app */
	app: string;

	/** Id of the message */
	message: string;

	/** Id of the tool */
	toolId: string;
}

export const ToolsView = observer(
	({ room, app, message, toolId }: ToolsViewProps) => {
		const liveTool = room.getTool(toolId);
		const tool = liveTool?.json;
		const toolResponse =
			liveTool?.status === "SUCCESS" ? liveTool.response : undefined;
		const toolParameters = liveTool?.parameters;

		/**
		 * State
		 */
		const iframeRef = useRef<HTMLIFrameElement>(null);
		const iframeReadyRef = useRef(false);

		/**
		 * Library Hooks
		 */

		// A system app UI is resolved entirely from _meta, so skip the metadata
		// lookup below: there may be no project or engine behind the tool at all.
		const declaredResource = tool?._meta?.SMSS_MCP_UI?.resourceURI;
		const resourceURI =
			typeof declaredResource === "string"
				? declaredResource.trim()
				: undefined;
		const systemAppUrl = resolveSystemAppUrl(resourceURI);

		// A component:// view is drawn in the page from the call itself, so it
		// needs no lookup either, and is never loaded in a frame.
		const toolView = useToolView(resourceURI);
		const isComponentView = isToolViewUri(resourceURI);
		const canShowPage =
			Boolean(resourceURI) &&
			!isComponentView &&
			(isAskExecutionMode(tool?._meta?.SMSS_MCP_EXECUTION) ||
				Boolean(toolResponse));

		// get the metadata — PROJECT-hosted tools use ProjectInfo, every other
		// engine type (VECTOR, STORAGE, DATABASE, MODEL, FUNCTION, ...) uses
		// EngineInfo. Fall back to ProjectInfo when the type is missing.
		const engineType = tool?._meta?.SMSS_ENGINE_TYPE;
		const isProjectType = !engineType || engineType === "PROJECT";
		const getAppInfo = usePixel<{
			project_type?: "BLOCKS" | "CODE" | "INSIGHT" | "";
		}>(
			app && canShowPage && !systemAppUrl
				? isProjectType
					? `ProjectInfo(project=["${app}"]);`
					: `EngineInfo(engine=["${app}"]);`
				: "",
			{
				data: {
					project_type: "",
				},
			},
		);

		const isLoading =
			canShowPage &&
			!systemAppUrl &&
			Boolean(app) &&
			(getAppInfo.status === "INITIAL" ||
				getAppInfo.status === "LOADING");
		let url = "";
		if (canShowPage) {
			if (systemAppUrl) {
				url = systemAppUrl;
			} else if (
				resourceURI &&
				app &&
				getAppInfo.status === "SUCCESS" &&
				!resourceURI.startsWith("system://")
			) {
				url =
					getAppInfo.data.project_type === "BLOCKS"
						? `${PLATFORM_URL}/#/s/${app}${resourceURI}`
						: `${Env.MODULE}/public_home/${app}/portals${resourceURI}`;
			}
		}

		/**
		 * Functions
		 */

		/**
		 * Process iframe on load
		 */
		const sendToolContext = useCallback(() => {
			const targetOrigin = url
				? new URL(url, window.location.origin).origin
				: window.location.origin;

			// send the parameters
			iframeRef.current?.contentWindow?.postMessage(
				{
					type: "SMSS_INIT_TOOL",
					tool: {
						type: "MCP",
						message: message || "",
						id: tool?.id || "",
						name: tool?.name || "",
						parameters: toJS(toolParameters || {}),
						roomId: room.roomId,
						original_name: tool?.original_name || "",
						tool_response: toolResponse,
						executedParameters: toJS(toolParameters || {}),
						_meta: toJS(tool?._meta || {}),
					} satisfies MCPToolRequest,
				},
				targetOrigin,
			);
		}, [message, room.roomId, tool, toolParameters, toolResponse, url]);

		const handleOnLoad = () => {
			iframeReadyRef.current = true;
			sendToolContext();
		};

		/**
		 * Effects
		 */

		useEffect(() => {
			if (iframeReadyRef.current) {
				sendToolContext();
			}
		}, [sendToolContext]);

		if (!tool) {
			return null;
		}

		// A call that names a component:// view the playground draws gets it,
		// in place of its card; work folder calls keep theirs.
		if (liveTool && toolView && !isFolderToolCall(tool)) {
			return (
				<ComponentToolView
					tool={liveTool}
					view={toolView}
					variant="panel"
					fallback={
						isChatToolCall(tool) ? (
							<ChatToolCard tool={liveTool} variant="panel" />
						) : (
							<ToolsDefaultView
								room={room}
								app={app}
								message={message}
								tool={liveTool}
							/>
						)
					}
				/>
			);
		}

		// Work folder and connector calls have their own card: the folder
		// tools run in the browser, and neither has an MCP project to fetch a
		// schema or a UI from.
		if (liveTool && isChatToolCall(tool)) {
			return <ChatToolCard tool={liveTool} variant="panel" />;
		}

		// Server tools (e.g. provider-side web_search) have no MCP project to
		// fetch a schema from — render the generic read-only result view.
		if (tool.server_tool && liveTool) {
			return <ToolsServerView tool={liveTool} />;
		}

		return (
			<div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
				{isLoading && <Skeleton className="h-full w-full" />}
				{!!url && !isLoading && (
					<iframe
						className="h-full w-full border-none"
						title="Tool"
						ref={iframeRef}
						src={url}
						onLoad={() => handleOnLoad()}
					/>
				)}
				{!url &&
					!isLoading &&
					liveTool &&
					(isRequestUserInputAction({
						toolName: liveTool.json.name,
						toolMeta: liveTool.json._meta,
					}) ? (
						(() => {
							const request = parseUserInputRequest({
								toolArgs: liveTool.json.arguments,
							});
							return request ? (
								<div className="p-3">
									<AgentUserInputCard
										request={request}
										disabled={!liveTool.pendingAction}
										onSubmit={async (answers) => {
											try {
												await decideAgentToolAction(
													liveTool,
													"respond",
													answers,
												);
											} catch (error) {
												toast.error(
													getErrorMessage(
														error,
														"Unable to submit these answers.",
													),
												);
											}
										}}
									/>
								</div>
							) : (
								<div className="p-3 text-destructive text-sm">
									The assistant sent an invalid input request
									and it cannot be displayed.
								</div>
							);
						})()
					) : (
						<ToolsDefaultView
							room={room}
							app={app}
							message={message}
							tool={liveTool}
						/>
					))}
			</div>
		);
	},
);
