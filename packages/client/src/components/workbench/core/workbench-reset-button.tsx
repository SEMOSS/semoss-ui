import { RotateCcw } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { CHROME_BUTTON, CHROME_ICON } from "./workbench.chrome";

/**
 * Resets the workbench layout back to its default arrangement, overwriting
 * the cached layout so the reset survives a reload.
 */
export const WorkbenchResetButton: FC = () => {
	const resetLayout = useWorkbench(
		(state) => state.layout.actions.resetLayout,
	);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Reset workbench"
					data-testid="workbench-reset-button"
					onClick={resetLayout}
					className={cn(
						"border border-transparent text-muted-foreground",
						CHROME_BUTTON,
					)}
				>
					<RotateCcw className={CHROME_ICON} />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Reset workbench</TooltipContent>
		</Tooltip>
	);
};
