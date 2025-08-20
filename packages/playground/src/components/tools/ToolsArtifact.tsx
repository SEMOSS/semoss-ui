import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Env, usePixel } from "@semoss/sdk/react";
import type { FlexLayout } from "@semoss/shared";
import { Skeleton, styled } from "@semoss/ui";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

const StyledContent = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	position: "relative",
	height: "100%",
	width: "100%",
	overflow: "hidden",
}));

const StyledIframeSkeleton = styled(Skeleton)(() => ({
	position: "absolute",
	zIndex: 1,
}));

const StyledIframe = styled("iframe")(() => ({
	border: "none",
	width: "100%",
	height: "100%",
}));

interface ArtifactAppProps {
	/** Node */
	node: FlexLayout.TabNode;
}

export const ArtifactApp: React.FC<ArtifactAppProps> = observer(({ node }) => {
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

	// Send parameters to iframe
	useEffect(() => {
		if (isLoading) {
			return;
		}

		iframeRef.current?.contentWindow?.postMessage(
			{
				type: "SMSS_INIT_TOOL",
				tool: {
					type: "MCP",
					message: config?.tool?.message || "",
					id: config?.tool?.id || "",
					name: config?.tool?.name || "",
					parameters: toJS(config?.tool?.parameters || {}),
				},
			},
			"*",
		);
	}, [
		isLoading,
		config?.tool?.message,
		config?.tool?.id,
		config?.tool?.name,
		config?.tool?.parameters,
	]);

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
		<StyledContent>
			{(!url || isLoading) && (
				<StyledIframeSkeleton
					variant="rectangular"
					width="100%"
					height="100%"
				/>
			)}
			<StyledIframe
				ref={iframeRef}
				src={url}
				onLoad={() => setIsLoading(false)}
			/>
		</StyledContent>
	);
});
