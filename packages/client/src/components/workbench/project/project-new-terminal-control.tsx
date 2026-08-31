import { PlusIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";

/** Opens another independent project terminal alongside the active one. */
export const ProjectNewTerminalControl: FC<WorkbenchChromeProps> = () => {
	const spawnPanel = useWorkbench((state) => state.layout.actions.spawnPanel);
	const nextTerminalNumber = useWorkbench((state) => {
		const terminalNumbers = Object.values(state.layout.panels)
			.filter(
				(panel) => panel.type === WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
			)
			.map((panel) => Number(panel.config?.terminalNumber ?? 1))
			.filter((number) => Number.isFinite(number));

		return Math.max(1, ...terminalNumbers) + 1;
	});

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="New terminal"
					data-testid="workbench-new-terminal-button"
					onClick={() =>
						spawnPanel(WORKBENCH_COMPONENTS.PROJECT_TERMINAL, {
							name: `Terminal ${nextTerminalNumber}`,
							config: { terminalNumber: nextTerminalNumber },
							canClose: true,
							target: { kind: "border", side: "bottom" },
						})
					}
					className={cn(
						"flex-none text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
				>
					<PlusIcon className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>New terminal</TooltipContent>
		</Tooltip>
	);
};
