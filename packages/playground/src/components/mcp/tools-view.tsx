import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Env, type MCPToolRequest, usePixel } from "@semoss/sdk/react";
import { Skeleton } from "@semoss/ui/next";
import type { RoomStore, ToolStore } from "@/stores";
import type { MCPTool } from "@/types";
import { ToolsDefaultView } from "./tools-default-view/index";

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
	tool: ToolStore["json"];

	/** Response to the tool */
	toolResponse?: string;

	/** Parameters that were executed */
	toolParameters?: Record<string, unknown>;
}

export const ToolsView: React.FC<ToolsViewProps> = observer(
	({ room, app, message, tool, toolResponse, toolParameters }) => {
		/**
		 * State
		 */
		const iframeRef = useRef<HTMLIFrameElement>(null);
		const [isLoading, setIsLoading] = useState<boolean>(true);
		const [url, setUrl] = useState<string | null>(null);

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

		const selectedTool = useMemo(() => {
			const toolNames = [tool.original_name, tool.name].filter(Boolean);

			return getMCP.data.tools.find((mcpTool) => {
				return (
					toolNames.includes(mcpTool.original_name) ||
					toolNames.includes(mcpTool.name)
				);
			});
		}, [getMCP.data.tools, tool.name, tool.original_name]);

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
						parameters: toJS(toolParameters || {}),
						roomId: room.roomId,
						original_name: tool.original_name || "",
						tool_response: toolResponse,
						executedParameters: toJS(toolParameters || {}),
					} satisfies MCPToolRequest,
				},
				"*",
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
					getAppInfo.status === "LOADING" ||
					getMCP.status === "INITIAL" ||
					getMCP.status === "LOADING"
				) {
					return;
				}

				// Ignore if no tool
				if (
					!app ||
					!tool ||
					getAppInfo.status === "ERROR" ||
					getMCP.status === "ERROR"
				) {
					setUrl(null);
					setIsLoading(false);
					return;
				}

				// Wait for selected tool to be available
				if (!selectedTool) {
					setUrl(null);
					setIsLoading(false);
					return;
				}

				setIsLoading(true);

				const mcpUi =
					selectedTool._meta?.SMSS_MCP_UI || tool._meta.SMSS_MCP_UI;

				if (mcpUi?.resourceURI) {
					if (getAppInfo.data.project_type === "BLOCKS") {
						setUrl(`${PLATFORM_URL}/#/s/${app}${mcpUi.resourceURI}`);
					} else {
						setUrl(
							`${Env.MODULE}/public_home/${app}/portals${mcpUi.resourceURI}`,
						);
					}

					setIsLoading(false);
					return;
				}

				// Legacy, check for portals
				if (getAppInfo.data.project_type === "BLOCKS") {
					setUrl(`${PLATFORM_URL}/#/s/${app}/`);
					setIsLoading(false);
					return;
				}

				let foundApp = false;
				try {
					const response = await fetch(
						`${Env.MODULE}/public_home/${app}/portals/`,
						{ method: "GET" },
					);
					const text = await response.text();
					foundApp =
						response.status === 200 &&
						Boolean(text) &&
						text !==
							"Publish is not enabled on this project or there was an error publishing this project";
				} catch (_error) {
					foundApp = false;
				}

				setUrl(
					foundApp
						? `${Env.MODULE}/public_home/${app}/portals/`
						: null,
				);
				setIsLoading(false);
			};

			void chooseUrl();
		}, [
			app,
			getAppInfo.data.project_type,
			getAppInfo.status,
			getMCP.status,
			selectedTool,
			tool,
		]);

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
				{!url && !isLoading && tool && (
					<ToolsDefaultView
						room={room}
						app={app}
						message={message}
						tool={tool}
						mcp={selectedTool}
						toolResponse={toolResponse}
						toolParameters={toolParameters}
					/>
				)}
			</div>
		);
	},
);
