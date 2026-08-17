import { SettingsIcon } from "lucide-react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_TABS,
} from "../workbench.constants";

/**
 * Toggles the shared engine settings tab within a workbench layout — opening,
 * selecting, or closing it — and highlights while it is the active tab.
 */
export const EngineSettingsToggle: React.FC = () => {
	const closePanel = useWorkbench((state) => state.closePanel);
	const openPanel = useWorkbench((state) => state.openPanel);
	const model = useWorkbench((state) => state.model);
	const settingsId = WORKBENCH_COMPONENTS.ENGINE_SETTINGS;
	const settingsNode = model.getNodeById(settingsId);
	const isSettingsOpen = settingsNode instanceof FlexLayout.TabNode;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Settings"
					data-testid="workbench-settings-toggle"
					onClick={() => {
						if (settingsNode instanceof FlexLayout.TabNode) {
							const parent = settingsNode.getParent();

							if (parent instanceof FlexLayout.TabSetNode) {
								if (
									parent.getSelectedNode()?.getId() ===
									settingsId
								) {
									closePanel(settingsId);
									return;
								}

								openPanel(
									settingsId,
									WORKBENCH_PANEL_TABS.ENGINE_SETTINGS,
								);
								return;
							}

							closePanel(settingsId);
						}

						openPanel(
							settingsId,
							WORKBENCH_PANEL_TABS.ENGINE_SETTINGS,
						);
					}}
					className={cn(
						"border",
						isSettingsOpen
							? "border-input text-primary shadow-xs dark:bg-input/30"
							: "border-transparent text-muted-foreground",
					)}
				>
					<SettingsIcon />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Settings</TooltipContent>
		</Tooltip>
	);
};
