import { CommandIcon } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";

/** Open the command palette for the nearest workbench from the global navbar. */
export const WorkbenchCommandMenuButton = () => {
	const setCommandOpen = useWorkbench((state) => state.setCommandOpen);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					aria-label="Open command menu"
					variant="ghost"
					size="icon"
					className="text-muted-foreground"
					onClick={() => setCommandOpen(true)}
				>
					<CommandIcon />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Commands</TooltipContent>
		</Tooltip>
	);
};
