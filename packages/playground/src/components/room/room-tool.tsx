import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { Env, usePixel } from "@semoss/sdk/react";
import type { FlexLayout } from "@semoss/shared";
import { Skeleton } from "@semoss/ui/next";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

interface RoomToolProps {
	/** Node */
	node: FlexLayout.TabNode;
}

export const RoomTool: React.FC<RoomToolProps> = observer(({ node }) => {
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

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// get the metadata
	const getAppInfo = usePixel<{
		project_type: "BLOCKS" | "CODE" | "INSIGHT" | "";
	}>(config.app ? `ProjectInfo(project=["${config.app}"]);` : "", {
		data: {
			project_type: "",
		},
	});

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
					message: config?.tool?.message || "",
					app: config?.app || "",
					id: config?.tool?.id || "",
					name: config?.tool?.name || "",
					parameters: toJS(config?.tool?.parameters || {}),
				},
			},
			"*",
		);

		// turn the loading screen off
		setIsLoading(false);
	};

	const url = useMemo(() => {
		// ignore if no tool
		if (!config || !config.app || getAppInfo.status !== "SUCCESS") {
			return "";
		}

		if (getAppInfo.data.project_type === "BLOCKS") {
			return `${PLATFORM_URL}/#/s/${config.app}/`;
		}

		return `${Env.MODULE}/public_home/${config.app}/portals/`;
	}, [config, config?.app, getAppInfo.status, getAppInfo.data]);

	if (!config) {
		return <div>No Tool</div>;
	}

	return (
		<div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
			{(!url || isLoading) && <Skeleton className="h-full w-full" />}
			<iframe
				className="h-full w-full border-none"
				title="Tool"
				ref={iframeRef}
				src={url}
				onLoad={() => handleOnLoad()}
			/>
		</div>
	);
});
