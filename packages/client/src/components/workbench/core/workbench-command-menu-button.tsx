import { CommandIcon } from "lucide-react";
import {
	Button,
	cn,
	Kbd,
	KbdGroup,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { WORKBENCH_STYLES } from "./workbench.chrome";

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
						WORKBENCH_STYLES.chromeButton,
					)}
				>
					<CommandIcon className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
			</TooltipTrigger>
			<TooltipContent
				side="right"
				className="flex flex-col items-center gap-1"
			>
				Commands
				<div>
					<KbdGroup>
						<Kbd>⌘</Kbd>
						<Kbd>⇧</Kbd>
						<Kbd>P</Kbd>
					</KbdGroup>{" "}
					or <Kbd>F1</Kbd>
				</div>
			</TooltipContent>
		</Tooltip>
	);
};
