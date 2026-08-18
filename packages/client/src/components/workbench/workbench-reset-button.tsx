import { RotateCcw } from "lucide-react";
import type { FlexLayout } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";

export interface WorkbenchResetButtonProps {
	/** Default layout the workbench is reset to */
	layout: FlexLayout.IJsonModel;
}

/**
 * Resets the workbench layout back to its default arrangement, overwriting the
 * cached layout.
 */
export const WorkbenchResetButton: React.FC<WorkbenchResetButtonProps> = ({
	layout,
}) => {
	const setModel = useWorkbench((state) => state.setModel);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Reset workbench"
					data-testid="workbench-reset-button"
					onClick={() => {
						try {
							// Deep-copy so the stored default layout is untouched.
							setModel(JSON.parse(JSON.stringify(layout)));
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
			<TooltipContent side="right">Reset workbench</TooltipContent>
		</Tooltip>
	);
};
