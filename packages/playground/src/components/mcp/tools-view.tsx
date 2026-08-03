import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { Env, type MCPToolRequest, usePixel } from "@semoss/sdk/react";
import { Skeleton } from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
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
		const [isLoading, setIsLoading] = useState<boolean>(true);
		const [url, setUrl] = useState("");

		/**
		 * Library Hooks
		 */

		// A system app UI is resolved entirely from _meta, so skip the metadata
		// lookup below: there may be no project or engine behind the tool at all.
		const systemAppUrl = resolveSystemAppUrl(
			tool?._meta?.SMSS_MCP_UI?.resourceURI,
		);

		// get the metadata — PROJECT-hosted tools use ProjectInfo, every other
		// engine type (VECTOR, STORAGE, DATABASE, MODEL, FUNCTION, ...) uses
		// EngineInfo. Fall back to ProjectInfo when the type is missing.
		const engineType = tool?._meta?.SMSS_ENGINE_TYPE;
		const isProjectType = !engineType || engineType === "PROJECT";
		const getAppInfo = usePixel<{
			project_type?: "BLOCKS" | "CODE" | "INSIGHT" | "";
		}>(
			app && !systemAppUrl
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
			const chooseUrl = async () => {
				// Ignore if no tool
				if (!tool) {
					setUrl("");
					setIsLoading(false);
					return;
				}

				// Auto-executing tool that hasn't completed yet — show default view
				if (tool._meta.SMSS_MCP_EXECUTION !== "ask" && !toolResponse) {
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

				// Finish loading
				if (
					getAppInfo.status === "INITIAL" ||
					getAppInfo.status === "LOADING"
				) {
					return;
				}

				// Ignore if the app metadata could not be resolved
				if (!app || getAppInfo.status === "ERROR") {
					setUrl("");
					setIsLoading(false);
					return;
				}

				setIsLoading(true);

				if (!tool._meta.SMSS_MCP_UI) {
					// Legacy, check for portals

					if (getAppInfo.data.project_type === "BLOCKS") {
						// Low code app
						setUrl(`${PLATFORM_URL}/#/s/${app}/`);
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
						foundApp
							? `${Env.MODULE}/public_home/${app}/portals/`
							: "",
					);
				} else {
					// Modern
					const resourceURI = tool._meta.SMSS_MCP_UI?.resourceURI;
					if (!resourceURI) {
						// No UI defined, show form
						setUrl("");
					} else if (resourceURI.startsWith("system://")) {
						// Malformed system URI. Fall back to the form rather than
						// building a public_home path out of the scheme.
						setUrl("");
					} else if (getAppInfo.data.project_type === "BLOCKS") {
						// Low code app
						setUrl(`${PLATFORM_URL}/#/s/${app}${resourceURI}`);
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
			getAppInfo.status,
			getAppInfo.data,
		]);

		useEffect(() => {
			if (iframeReadyRef.current) {
				sendToolContext();
			}
		}, [sendToolContext]);

		if (!tool) {
			return null;
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
				{!url && !isLoading && liveTool && (
					<ToolsDefaultView
						room={room}
						app={app}
						message={message}
						tool={liveTool}
					/>
				)}
			</div>
		);
	},
);
