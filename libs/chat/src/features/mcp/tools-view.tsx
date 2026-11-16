import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { isRequestUserInputAction, parseUserInputRequest } from "@semoss/sdk";
import { Env, type MCPToolRequest, usePixel } from "@semoss/sdk/react";
import { isToolViewUri, useToolView } from "@semoss/shared";
import { AgentUserInputCard, Skeleton, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import { useChatConfig } from "../chat-config/use-chat-config";
import { ChatToolCard } from "../chat-tools/components/chat-tool-card";
import {
	isChatToolCall,
	isFolderToolCall,
} from "../chat-tools/tools/chat-tool-kind";
import { decideAgentToolAction } from "../messages/agent-harness";
import type { ToolStore } from "../messages/tool.store";
import type { RoomStore } from "../room/room.store";
import { useRoomSelector } from "../room/use-room-selector";
import { ToolInspector } from "../tool-inspector/tool-inspector";
import { ComponentToolView } from "../tool-views/component-tool-view";
import { isAskExecutionMode } from "./mcp-utils";
import { ToolsDefaultView } from "./tools-default-view/tools-default-view";

/**
 * A tool whose UI ships with the web app declares it as
 * `system://<package>/<path>` instead of pointing at a published project portal.
 * These load straight from a sibling package's build output, so there is no
 * project to look up and no `public_home` round trip.
 */
const SYSTEM_APP_URI = /^system:\/\/([a-zA-Z0-9._-]+)(\/.*)?$/;

/**
 * Resolves a `system://` resourceURI to a path relative to this app's own
 * build output.
 *
 * @param resourceURI - The tool's `SMSS_MCP_UI.resourceURI`, if any.
 * @returns The app's path, or null when the URI is not a system app URI.
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

/** Stands in for a call the room does not have yet, so the hook runs either way. */
const NO_TOOL = {
	getSnapshot: () => null,
	subscribe: () => () => {},
};

/** What {@link ToolsView} reads from its call. */
interface ToolsViewCall {
	tool: ToolStore["json"] | undefined;
	toolResponse: string | undefined;
	toolParameters: ToolStore["parameters"] | undefined;
	hasPendingAction: boolean;
}

/** Props for {@link ToolsView}. */
interface ToolsViewProps {
	/** The room the call belongs to. */
	room: RoomStore;

	/** Id of the app (project or engine) that owns the tool, or empty for none. */
	app: string;

	/** Id of the message that made the call. */
	message: string;

	/** Id of the tool call in the room. */
	toolId: string;
}

/**
 * Draws one tool call in the Workspace: its component view, its chat tool card,
 * its app's page in a frame, a request for the user's input, or the default form.
 * The call is read from the room by id, so the view follows it as it changes.
 */
export const ToolsView = ({ room, app, message, toolId }: ToolsViewProps) => {
	const { t } = useTranslation("tool");
	const { platformUrl } = useChatConfig();
	const liveTool = useRoomSelector(room, (current) =>
		current.getTool(toolId),
	);
	// the call's own changes, as `useTool` reads them, before the room has it
	const { tool, toolResponse, toolParameters, hasPendingAction } =
		useStoreSelector<unknown, ToolsViewCall>(liveTool ?? NO_TOOL, () => ({
			tool: liveTool?.json,
			toolResponse:
				liveTool?.status === "SUCCESS" ? liveTool.response : undefined,
			toolParameters: liveTool?.parameters,
			hasPendingAction: !!liveTool?.pendingAction,
		}));

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const iframeReadyRef = useRef(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [url, setUrl] = useState("");

	// A system app UI is resolved entirely from _meta, so skip the metadata
	// lookup below: there may be no project or engine behind the tool at all.
	const resourceURI = tool?._meta?.SMSS_MCP_UI?.resourceURI;
	const systemAppUrl = resolveSystemAppUrl(resourceURI);

	// A component:// view is drawn in the page from the call itself, so it
	// needs no lookup either, and is never loaded in a frame.
	const toolView = useToolView(resourceURI);
	const isComponentView = isToolViewUri(resourceURI);

	// get the metadata — PROJECT-hosted tools use ProjectInfo, every other
	// engine type (VECTOR, STORAGE, DATABASE, MODEL, FUNCTION, ...) uses
	// EngineInfo. Fall back to ProjectInfo when the type is missing.
	const engineType = tool?._meta?.SMSS_ENGINE_TYPE;
	const isProjectType = !engineType || engineType === "PROJECT";
	const getAppInfo = usePixel<{
		project_type?: "BLOCKS" | "CODE" | "INSIGHT" | "";
	}>(
		app && !systemAppUrl && !isComponentView
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

	/** Posts the call to the framed app, which waits for it before it draws. */
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
					parameters: toolParameters || {},
					roomId: room.roomId,
					original_name: tool?.original_name || "",
					tool_response: toolResponse,
					executedParameters: toolParameters || {},
					_meta: tool?._meta || {},
				} satisfies MCPToolRequest,
			},
			targetOrigin,
		);
	}, [message, room.roomId, tool, toolParameters, toolResponse, url]);

	/** Marks the frame ready and hands it the call. */
	const handleIframeLoad = (): void => {
		iframeReadyRef.current = true;
		sendToolContext();
	};

	// Pick what to draw: a frame URL, or none for the card or the form.
	useEffect(() => {
		const chooseUrl = async () => {
			// No call yet
			if (!tool) {
				setUrl("");
				setIsLoading(false);
				return;
			}

			// A component:// view is drawn below, or the generic view when
			// the playground has no such view; neither is a page.
			if (isComponentView) {
				setUrl("");
				setIsLoading(false);
				return;
			}

			// Auto-executing tool that hasn't completed yet: show the default view
			if (
				!isAskExecutionMode(tool._meta?.SMSS_MCP_EXECUTION) &&
				!toolResponse
			) {
				setUrl("");
				setIsLoading(false);
				return;
			}

			// System app UI. Resolved before any metadata gate because no
			// ProjectInfo/EngineInfo pixel is issued for these tools, so
			// getAppInfo never leaves INITIAL.
			if (systemAppUrl) {
				setUrl(systemAppUrl);
				setIsLoading(false);
				return;
			}

			// No app to resolve (e.g. platform-synthesized tools like the
			// subagent control tools, which aren't backed by any MCP
			// project/engine) -- usePixel never leaves "INITIAL" for an
			// empty pixel string, so this must be checked before the
			// loading gate below or it waits forever.
			if (!app) {
				setUrl("");
				setIsLoading(false);
				return;
			}

			// Finish loading
			if (
				getAppInfo.status === "INITIAL" ||
				getAppInfo.status === "LOADING"
			) {
				return;
			}

			// Ignore if the app metadata could not be resolved
			if (getAppInfo.status === "ERROR") {
				setUrl("");
				setIsLoading(false);
				return;
			}

			setIsLoading(true);

			if (!tool._meta?.SMSS_MCP_UI) {
				// Legacy, check for portals

				if (getAppInfo.data.project_type === "BLOCKS") {
					// Low code app
					setUrl(`${platformUrl}/#/s/${app}/`);
				}

				// Check if portals exists
				let foundApp = false;
				try {
					const response = await fetch(
						`${Env.MODULE}/public_home/${app}/portals/`,
						{ method: "GET" },
					);
					const text = await response.text();
					//FixMe: Always returns a 200 so currently checking against default text returned
					foundApp =
						response.status === 200 &&
						Boolean(text) &&
						text !==
							"Publish is not enabled on this project or there was an error publishing this project";
				} catch (_e) {}

				// Portals view else use default view off tool JSON
				setUrl(
					foundApp ? `${Env.MODULE}/public_home/${app}/portals/` : "",
				);
			} else {
				// Modern
				const resourceURI = tool._meta?.SMSS_MCP_UI?.resourceURI;
				if (!resourceURI) {
					// No UI defined, show form
					setUrl("");
				} else if (resourceURI.startsWith("system://")) {
					// Malformed system URI. Fall back to the form rather than
					// building a public_home path out of the scheme.
					setUrl("");
				} else if (getAppInfo.data.project_type === "BLOCKS") {
					// Low code app
					setUrl(`${platformUrl}/#/s/${app}${resourceURI}`);
				} else {
					setUrl(
						`${Env.MODULE}/public_home/${app}/portals${resourceURI}`,
					);
				}
			}

			setIsLoading(false);
		};

		chooseUrl();
	}, [
		app,
		tool,
		toolResponse,
		systemAppUrl,
		isComponentView,
		getAppInfo.status,
		getAppInfo.data,
		platformUrl,
	]);

	// Re-send the call to a loaded frame whenever it changes.
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
	// fetch a schema from, so show their parameters and result read-only.
	if (tool.server_tool && liveTool) {
		return <ToolInspector tool={liveTool} />;
	}

	return (
		<div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
			{isLoading && <Skeleton className="h-full w-full" />}
			{!!url && !isLoading && (
				<iframe
					className="h-full w-full border-none"
					title={t("view.frameTitle")}
					ref={iframeRef}
					src={url}
					onLoad={handleIframeLoad}
				/>
			)}
			{!url &&
				!isLoading &&
				liveTool &&
				(isRequestUserInputAction({
					toolName: tool.name,
					toolMeta: tool._meta,
				}) ? (
					(() => {
						const request = parseUserInputRequest({
							toolArgs: tool.arguments,
						});
						return request ? (
							<div className="p-3">
								<AgentUserInputCard
									request={request}
									disabled={!hasPendingAction}
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
													t(
														"view.submitAnswersError",
													),
												),
											);
										}
									}}
								/>
							</div>
						) : (
							<div className="p-3 text-destructive text-sm">
								{t("view.invalidInputRequest")}
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
};
