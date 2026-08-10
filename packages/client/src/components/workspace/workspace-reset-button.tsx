import { RotateCcw } from "lucide-react";
import type { FlexLayout } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkspace } from "@/hooks";

interface WorkspaceResetButtonProps {
	/** Default layout the workspace is reset to */
	layout: FlexLayout.IJsonModel;
}

/**
 * Resets the workspace layout back to its default arrangement.
 */
export const WorkspaceResetButton: React.FC<WorkspaceResetButtonProps> = ({
	layout,
}) => {
	const { workspace } = useWorkspace();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Reset workspace"
					data-testid="workspace-reset-button"
					onClick={() => {
						try {
							// Deep-copy so the stored default layout is untouched.
							workspace.updateLayout(
								JSON.parse(JSON.stringify(layout)),
							);
						} catch (error) {
							console.error(error);
							throw error;
						}
					}}
					className="border border-transparent text-muted-foreground"
				>
					<RotateCcw />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Reset workspace</TooltipContent>
		</Tooltip>
	);
};
