import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import type { FlexLayout } from "@semoss/shared";
import { Skeleton, styled } from "@semoss/ui";
import type { ResponseMessageStore } from "@/stores";

const VITE_LOGO_TOOL_ARTIFACT_URL = import.meta.env.VITE_LOGO_TOOL_ARTIFACT_URL
	? import.meta.env.VITE_LOGO_TOOL_ARTIFACT_URL
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
	/** Room to render */
	node: FlexLayout.TabNode;
}

export const ArtifactApp: React.FC<ArtifactAppProps> = observer(({ node }) => {
	const config = node.getConfig() as {
		tool: ResponseMessageStore["tools"][number];
	};

	const tool = config.tool;

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
		if (!tool) {
			return "";
		}

		// construct the url
		let url = `${VITE_LOGO_TOOL_ARTIFACT_URL}#/s/${tool.id}`;

		const params = [];
		for (const [key, value] of Object.entries(tool.parameters)) {
			if (typeof value !== "undefined") {
				params.push(`${key}=${value}`);
			}
		}

		if (params.length > 0) {
			url += `?${params.concat("&")}`;
		}

		return url;
	}, [tool]);

	console.log(url);

	if (!tool) {
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
