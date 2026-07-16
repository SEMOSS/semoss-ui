import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Env, type MCPToolRequest, usePixel } from "@semoss/sdk/react";
import { Skeleton } from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { ToolsDefaultView } from "./tools-default-view";
import { ToolsServerView } from "./tools-server-view";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

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
		const [isLoading, setIsLoading] = useState<boolean>(true);
		const [url, setUrl] = useState("");

		/**
		 * Library Hooks
		 */

		// get the metadata
		const getAppInfo = usePixel<{
			project_type: "BLOCKS" | "CODE" | "INSIGHT" | "";
		}>(app ? `ProjectInfo(project=["${app}"]);` : "", {
			data: {
				project_type: "",
			},
		});

		/**
		 * Functions
		 */

		/**
		 * Process iframe on load
		 */
		const handleOnLoad = () => {
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
		};

		/**
		 * Effects
		 */

		useEffect(() => {
			const chooseUrl = async () => {
				// Finish loading
				if (
					getAppInfo.status === "INITIAL" ||
					getAppInfo.status === "LOADING"
				) {
					return;
				}

				// Ignore if no tool
				if (!app || !tool || getAppInfo.status === "ERROR") {
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
		}, [app, tool, toolResponse, getAppInfo.status, getAppInfo.data]);

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
