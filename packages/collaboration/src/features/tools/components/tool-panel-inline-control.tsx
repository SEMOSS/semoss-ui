import { PanelBottom } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useWorkbenchPanel, WORKBENCH_STYLES } from "@semoss/workbench";
import { useToolWorkbench } from "../tool-workbench.context";
import type { ToolPanelConfig } from "../types/tool-workbench";

/** Move the active workbench tool back into its transcript card. */
export function ToolPanelInlineControl({ id }: WorkbenchPanelProps) {
	const { config } = useWorkbenchPanel<ToolPanelConfig>(id);
	const { openInline } = useToolWorkbench();
	if (!config?.toolId) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className={WORKBENCH_STYLES.chromeButton}
					aria-label="Open inline"
					onClick={(event) => {
						event.stopPropagation();
						openInline(config.toolId);
					}}
				>
					<PanelBottom
						aria-hidden="true"
						className={WORKBENCH_STYLES.chromeIcon}
					/>
				</Button>
			</TooltipTrigger>
			<TooltipContent>Open inline</TooltipContent>
		</Tooltip>
	);
}
