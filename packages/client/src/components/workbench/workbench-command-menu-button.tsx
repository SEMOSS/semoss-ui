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
					variant="ghost"
					size="icon-sm"
					aria-label="Open command menu"
					onClick={() => setCommandOpen(true)}
					className="border border-transparent text-muted-foreground"
				>
					<CommandIcon />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Commands</TooltipContent>
		</Tooltip>
	);
};
