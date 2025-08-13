import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { Env } from "@semoss/sdk/react";
import type { FlexLayout } from "@semoss/shared";
import { Skeleton, styled } from "@semoss/ui";

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
	/** Room to render */
	node: FlexLayout.TabNode;
}

export const ArtifactApp: React.FC<ArtifactAppProps> = observer(({ node }) => {
	const config: {
		messageId?: string;
		appId?: string;
		toolId?: string;
		toolName?: string;
		toolArguments?: Record<string, unknown>;
	} = useMemo(() => {
		return node.getConfig();
	}, [node]);

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	/**
	 * Handle iframe load event
	 */
	const handleOnLoad = () => {
		setIsLoading(false);
	};

	const url = useMemo(() => {
		// ignore if no tool
		if (!config || !config.appId) {
			return "";
		}

		const params = new URLSearchParams();

		params.set("messageId", config.messageId);
		params.set("toolId", config.toolId);
		params.set("toolName", config.toolName);
		if (
			config.toolArguments &&
			Object.keys(config.toolArguments).length > 0
		) {
			params.set("toolArguments", JSON.stringify(config.toolArguments));
		}

		return `${Env.MODULE}/public_home/${config.appId}/portals/?${params.toString()}`;
	}, [
		config,
		config?.messageId,
		config?.appId,
		config?.toolId,
		config?.toolName,
		config?.toolArguments,
	]);

	if (!config) {
		return <div>No Tool</div>;
	}

	return (
		<StyledContent>
			{isLoading && (
				<StyledIframeSkeleton
					variant="rectangular"
					width="100%"
					height="100%"
				/>
			)}
			<StyledIframe
				ref={iframeRef}
				src={url}
				onLoad={() => handleOnLoad()}
			/>
		</StyledContent>
	);
});
