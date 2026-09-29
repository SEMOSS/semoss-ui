import { ChevronDown, Command } from "lucide-react";
import { useRef, useState } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@semoss/workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { WorkPanelSwitcher } from "./work-panel-switcher";

/** Fixed panels and open files, directly reachable from the top border. */
export function WorkViewMenu() {
	const workbench = useToolWorkbench();
	const [isOpen, setIsOpen] = useState(false);
	const isOpeningCommands = useRef(false);
	const setCommandOpen = useWorkbench(
		(state) => state.command.actions.setCommandOpen,
	);
	return (
		<DropdownMenu
			open={isOpen && workbench.isOpen}
			onOpenChange={setIsOpen}
		>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-11 gap-1 px-2 text-xs md:h-6"
				>
					View <ChevronDown aria-hidden="true" className="size-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-56"
				onCloseAutoFocus={(event) => {
					if (isOpeningCommands.current) event.preventDefault();
					isOpeningCommands.current = false;
				}}
			>
				<WorkPanelSwitcher />
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="min-h-8 py-1 text-xs md:min-h-7"
					onSelect={() => {
						isOpeningCommands.current = true;
						setCommandOpen(true);
					}}
				>
					<Command aria-hidden="true" className="size-3.5" />{" "}
					Commands…
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
