import { CommandIcon } from "lucide-react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { CHROME_BUTTON, CHROME_ICON } from "./core/workbench.chrome";

/** Open the command palette for the nearest workbench from the global navbar. */
export const WorkbenchCommandMenuButton = () => {
	const setCommandOpen = useWorkbench(
		(state) => state.command.actions.setCommandOpen,
	);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Open command menu"
					onClick={() => setCommandOpen(true)}
					className={cn(
						"border border-transparent text-muted-foreground",
						CHROME_BUTTON,
					)}
				>
					<CommandIcon className={CHROME_ICON} />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Commands</TooltipContent>
		</Tooltip>
	);
};
