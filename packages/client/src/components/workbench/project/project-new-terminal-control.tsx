import { PlusIcon } from "lucide-react";
import type { FC } from "react";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useWorkbench, WorkbenchChromeButton } from "@semoss/workbench";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";

/** Opens another independent project terminal alongside the active one. */
export const ProjectNewTerminalControl: FC<WorkbenchPanelProps> = () => {
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
		<WorkbenchChromeButton
			icon={PlusIcon}
			label="New terminal"
			onClick={() =>
				spawnPanel(WORKBENCH_COMPONENTS.PROJECT_TERMINAL, {
					name: `Terminal ${nextTerminalNumber}`,
					config: { terminalNumber: nextTerminalNumber },
					canClose: true,
					target: { kind: "border", side: "bottom" },
				})
			}
			data-testid="workbench-new-terminal-button"
		/>
	);
};
