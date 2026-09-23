import {
	type SandpackFiles,
	SandpackPreview,
	SandpackProvider,
} from "@codesandbox/sandpack-react";
import { type CSSProperties, useMemo } from "react";
import { cn } from "@semoss/ui/next";

const EMPTY_HTML_DOCUMENT =
	"<!DOCTYPE html><html><head></head><body></body></html>";

interface SandpackHtmlPreviewProps {
	html: string;
	className?: string;
	style?: CSSProperties;
	providerClassName?: string;
	forceFullHeight?: boolean;
}

const FULL_HEIGHT_SANDPACK_PREVIEW_OVERRIDES = `
[data-semoss-sandpack-full-height="true"] .sp-wrapper,
[data-semoss-sandpack-full-height="true"] .sp-stack,
[data-semoss-sandpack-full-height="true"] .sp-preview,
[data-semoss-sandpack-full-height="true"] .sp-preview-container {
	height: 100% !important;
	min-height: 0 !important;
}

[data-semoss-sandpack-full-height="true"] .sp-preview,
[data-semoss-sandpack-full-height="true"] .sp-preview-container {
	overflow: hidden !important;
}

[data-semoss-sandpack-full-height="true"] .sp-preview-iframe {
	height: 100% !important;
	min-height: 0 !important;
	max-height: none !important;
}
`;

export const SandpackHtmlPreview = ({
	html,
	className,
	style,
	providerClassName,
	forceFullHeight,
}: SandpackHtmlPreviewProps) => {
	const files = useMemo<SandpackFiles>(() => {
		return {
			"/index.html": {
				code: html.trim() ? html : EMPTY_HTML_DOCUMENT,
				active: true,
			},
		};
	}, [html]);

	return (
		<div
			data-semoss-sandpack-full-height={
				forceFullHeight ? "true" : undefined
			}
			className={cn(forceFullHeight && "h-full min-h-0")}
		>
			{forceFullHeight && (
				<style>{FULL_HEIGHT_SANDPACK_PREVIEW_OVERRIDES}</style>
			)}
			<SandpackProvider
				template="static"
				files={files}
				className={cn(
					"min-h-0",
					forceFullHeight && "h-full",
					providerClassName,
				)}
				options={{
					activeFile: "/index.html",
					visibleFiles: ["/index.html"],
					autorun: true,
					autoReload: true,
					recompileMode: "delayed",
					recompileDelay: 80,
					initMode: "immediate",
				}}
			>
				<SandpackPreview
					className={cn(
						forceFullHeight && "h-full min-h-0 overflow-hidden",
						className,
					)}
					style={style}
					showNavigator={false}
					showOpenInCodeSandbox={false}
					showOpenNewtab
					showRefreshButton
					showRestartButton={false}
					showSandpackErrorOverlay
				/>
			</SandpackProvider>
		</div>
	);
};
