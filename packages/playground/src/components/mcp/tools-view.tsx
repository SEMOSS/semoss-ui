import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Env, type MCPToolRequest, usePixel } from "@semoss/sdk/react";
import { Skeleton } from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import type { MCPTool } from "@/types";
import { ToolsDefaultView } from "./tools-default-view";

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

	/** Connected tool */
	tool: {
		id: string;
		name: string;
		parameters: Record<string, unknown>;
		original_name: string;
	};

	/** Response to the tool */
	toolResponse?: string;
}

export const ToolsView: React.FC<ToolsViewProps> = observer(
	({ room, app, message, tool, toolResponse }) => {
		/**
		 * State
		 */
		const iframeRef = useRef<HTMLIFrameElement>(null);
		const [isLoading, setIsLoading] = useState<boolean>(true);
		const [url, setUrl] = useState("");
		const [selectedTool, setSelectedTool] = useState<MCPTool>(null);

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

		// Get tool JSON
		const getMCP = usePixel<{
			_meta: {
				SMSS_PROJECT_NAME: string;
				SMSS_PROJECT_ID: string;
				SMSS_ENGINE_NAME: string;
				SMSS_ENGINE_TYPE: string;
				SMSS_ENGINE_ID: string;
			};
			tools: MCPTool[];
		}>(`GetMCPTools(project=["${app}"]);`, {
			data: {
				tools: [
					{
						name: "",
						description: "",
						title: "",
						inputSchema: {
							properties: {},
							type: "object",
							required: [],
							title: "",
						},
						original_name: "",
						_meta: {
							generated_on: "",
						},
					},
				],
				_meta: {
					SMSS_ENGINE_ID: "",
					SMSS_ENGINE_NAME: "",
					SMSS_ENGINE_TYPE: "",
					SMSS_PROJECT_ID: "",
					SMSS_PROJECT_NAME: "",
				},
			},
		});

		/**
		 * Functions
		 */

		/**
		 * Process iframe on load
		 */
		const handleOnLoad = () => {
			// send the parameters
			iframeRef.current?.contentWindow?.postMessage(
				{
					type: "SMSS_INIT_TOOL",
					tool: {
						type: "MCP",
						message: message || "",
						id: tool?.id || "",
						name: tool?.name || "",
						parameters: toJS(tool?.parameters || {}),
						roomId: room.roomId,
						original_name: selectedTool?.original_name || "",
						tool_response: toolResponse,
					} satisfies MCPToolRequest,
				},
				"*",
			);
		};

		/**
		 * Effects
		 */

		// Initialize selected tool from tool info
		useEffect(() => {
			if (getMCP.status === "SUCCESS" && tool?.original_name) {
				setSelectedTool(
					getMCP.data.tools.find(
						(a) => a.name === tool.original_name,
					),
				);
			}
		}, [getMCP, tool.original_name]);

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

				setIsLoading(true);

				if (!selectedTool._meta.SMSS_MCP_UI) {
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
							text &&
							text !==
								"Publish is not enabled on this project or there was an error publishing this project";
					} catch (_e) {}

					// Portals view else use default view off tool JSON
					setUrl(
						foundApp
							? `${Env.MODULE}/public_home/${app}/portals/`
							: null,
					);
				} else {
					// Modern
					const resourceURI =
						selectedTool._meta.SMSS_MCP_UI?.resourceURI;
					if (!resourceURI) {
						// No UI defined, show form
						setUrl(null);
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
		}, [app, tool, getAppInfo.status, getAppInfo.data, selectedTool]);

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
				{!url && !isLoading && selectedTool && (
					<ToolsDefaultView
						room={room}
						app={app}
						message={message}
						tool={tool}
						mcp={selectedTool}
					/>
				)}
			</div>
		);
	},
);
