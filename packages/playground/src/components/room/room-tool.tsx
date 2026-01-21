import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Env, type MCPToolRequest, usePixel } from "@semoss/sdk/react";
import type { FlexLayout } from "@semoss/shared";
import { Skeleton } from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import type { MCPTool, Tool } from "@/types";
import { DynamicForm } from "../mcp/tools-default-view";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

interface ToolStructure {
	_meta: {
		SMSS_PROJECT_NAME: string;
		SMSS_PROJECT_ID: string;
		SMSS_ENGINE_NAME: string;
		SMSS_ENGINE_TYPE: string;
		SMSS_ENGINE_ID: string;
	};
	tools: Tool[];
}

interface RoomToolProps {
	/** Node */
	node: FlexLayout.TabNode;

	/** Room store */
	room: RoomStore;
}

/**
 * Renders a tool inside a room
 *
 * @component
 */
export const RoomTool: React.FC<RoomToolProps> = observer(({ node, room }) => {
	/**
	 * State
	 */
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [selectedTool, setSelectedTool] = useState<MCPTool>(null);
	const [formData, setFormData] = useState<Record<string, unknown>>({});
	const [url, setUrl] = useState("");

	/**
	 * Library Hooks
	 */
	// Get the app metadata
	const getAppInfo = usePixel<{
		project_type: "BLOCKS" | "CODE" | "INSIGHT" | "";
	}>(
		node.getConfig().app
			? `ProjectInfo(project=["${node.getConfig().app}"]);`
			: "",
		{
			data: {
				project_type: "",
			},
		},
	);

	// Get tool JSON
	const getToolInfo = usePixel<ToolStructure>(
		`GetMCPTools(project=["${node.getConfig().app}"]);`,
		{
			data: {
				tools: [
					{
						name: "",
						description: "",
						title: "",
						_meta: { generated_on: "" },
						inputSchema: {
							properties: {},
							type: "object",
							required: [],
							title: "",
						},
						original_name: "",
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
		},
	);

	/**
	 * Functions
	 */
	// Process iframe on load and send initialization message
	const handleOnLoad = () => {
		const config = node.getConfig();

		// send the parameters
		iframeRef.current?.contentWindow?.postMessage(
			{
				type: "SMSS_INIT_TOOL",
				tool: {
					type: "MCP",
					message: config?.tool?.message || "",
					id: config?.tool?.id || "",
					name: config?.tool?.name || "",
					parameters: toJS(config?.tool?.parameters || {}),
					roomId: room.roomId,
					original_name: selectedTool?.original_name || "",
				} satisfies MCPToolRequest,
			},
			"*",
		);
	};

	/**
	 * Memos / Effects
	 */
	const config: {
		app: string;
		tool: {
			message: string;
			id: string;
			name: string;
			parameters: Record<string, unknown>;
		};
	} = useMemo(() => {
		return node.getConfig();
	}, [node]);

	// Initialize selected tool from tool info
	useEffect(() => {
		if (getToolInfo.status === "SUCCESS" && config?.tool?.name) {
			setSelectedTool(
				getToolInfo.data.tools.find((a) => {
					const underscoreIndex = config.tool.name.indexOf("_");
					const shortName =
						underscoreIndex !== -1
							? config.tool.name.substring(underscoreIndex + 1)
							: config.tool.name;
					return a.name === shortName;
				}),
			);
		}
	}, [getToolInfo, config.tool.name]);

	// Check portal availability and set appropriate URL
	useEffect(() => {
		const checkPortal = async () => {
			// Finish loading
			if (
				getAppInfo.status === "INITIAL" ||
				getAppInfo.status === "LOADING"
			) {
				return;
			}
			setFormData(toJS(config?.tool?.parameters || {}));

			// Ignore if no tool
			if (!config || !config.app || getAppInfo.status === "ERROR") {
				setUrl("");
				setIsLoading(false);
				return;
			}

			setIsLoading(true);

			// Low code app
			if (getAppInfo.data.project_type === "BLOCKS") {
				setUrl(`${PLATFORM_URL}/#/s/${config.app}/`);
				setIsLoading(false);
				return;
			}

			// Check if portals exists
			let foundApp = false;
			try {
				const response = await fetch(
					`${Env.MODULE}/public_home/${config.app}/portals/`,
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
					? `${Env.MODULE}/public_home/${config.app}/portals/`
					: null,
			);
			setIsLoading(false);
		};
		checkPortal();
	}, [config, config?.app, getAppInfo.status, getAppInfo.data]);

	if (!config) {
		return <div>No Tool</div>;
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
			{!url && !isLoading && selectedTool?.name && (
				<DynamicForm
					tool={selectedTool}
					formData={formData}
					room={room}
					config={config}
				/>
			)}
		</div>
	);
});
