import { PanelsTopLeftIcon, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { CodeRenderer } from "@/components/project";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { CHROME_BUTTON, CHROME_ICON } from "../../core/workbench.chrome";

/** The config an app-preview instance is opened with. */
export interface CodeAppRendererConfig {
	/** Bumped by a publish to force the iframe to remount. */
	previewVersion?: number;
}

const CodeAppRendererPanelContent: WorkbenchComponent<
	CodeAppRendererConfig
> = ({ id, config }) => {
	const { project } = useProject();
	const [counter, setCounter] = useState(0);

	useWorkbenchControl(id, () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className={cn(
						"flex-none text-muted-foreground",
						CHROME_BUTTON,
					)}
					onClick={() => setCounter((count) => count + 1)}
					aria-label="Refresh app"
					data-testid="workbench-app-renderer-refresh"
				>
					<RefreshCw className={CHROME_ICON} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Refresh</TooltipContent>
		</Tooltip>
	));

	return (
		<div className="h-full w-full overflow-hidden bg-background text-foreground">
			<CodeRenderer
				appId={project.project_id}
				key={`${counter}-${config.previewVersion}`}
			/>
		</div>
	);
};

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
