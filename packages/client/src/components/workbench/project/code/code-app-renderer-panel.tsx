import { PanelsTopLeftIcon, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import { CodeRenderer } from "@/components/project";
import { useProject } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";

interface CodeAppRendererPanelProps {
	/**
	 * Bumped when an agent run (or a manual rebuild) publishes the frontend, so
	 * the iframe remounts on the freshly published assets.
	 */
	previewVersion: number;
}

/**
 * Live preview of the published CODE app, rendered in an iframe. The refresh
 * button remounts the iframe by bumping a key — the embedded app has no
 * reload hook of its own.
 */
export const CodeAppRendererPanel: React.FC<CodeAppRendererPanelProps> = ({
	previewVersion,
}) => {
	const { project } = useProject();
	const [counter, setCounter] = useState(0);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
			<div className="flex w-full flex-row items-center border-border border-b bg-card px-1 py-1">
				<Button
					variant="ghost"
					size="icon-sm"
					title="Refresh"
					aria-label="Refresh app"
					data-testid="workbench-app-renderer-refresh"
					onClick={() => setCounter((count) => count + 1)}
				>
					<RefreshCw className="h-[1em] w-[1em]" />
				</Button>
			</div>
			{/* min-h-0 so the iframe fills the remaining height instead of collapsing */}
			<div className="min-h-0 w-full flex-1 overflow-hidden">
				<CodeRenderer
					appId={project.project_id}
					key={`${counter}-${previewVersion}`}
				/>
			</div>
		</div>
	);
};

/** The config an app-preview instance is opened with. */
export interface CodeAppRendererConfig {
	/** Bumped by a publish to force the iframe to remount. */
	previewVersion?: number;
}

const CodeAppRendererPanelContent: WorkbenchComponent<
	CodeAppRendererConfig
> = ({ config }) => (
	<CodeAppRendererPanel previewVersion={config.previewVersion ?? 0} />
);

/**
 * Blueprint for the app preview. keepAlive: the iframe survives tab switches;
 * publishes remount it by bumping `config.previewVersion` on the record.
 */
export const PROJECT_APP_RENDERER_PANEL: WorkbenchPanelConfig<CodeAppRendererConfig> =
	{
		name: "App",
		helpText: "App Preview",
		icon: ({ className }) => <PanelsTopLeftIcon className={className} />,
		canClose: false,
		canRename: false,
		mount: "keepAlive",
		content: CodeAppRendererPanelContent,
	};
