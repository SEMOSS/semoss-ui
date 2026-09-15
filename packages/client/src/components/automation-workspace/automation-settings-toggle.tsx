import { SettingsIcon } from "lucide-react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench, WORKBENCH_STYLES } from "@semoss/workbench";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";

/**
 * Opens or closes the automation project's existing settings panel.
 */
export const AutomationSettingsToggle: React.FC = () => {
	const actions = useWorkbench((state) => state.layout.actions);
	const settingsId = WORKBENCH_COMPONENTS.PROJECT_SETTINGS;
	const isShowing = useWorkbench(
		(state) => state.layout.panelSlots[settingsId]?.active ?? false,
	);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Settings"
					data-testid="automation-workbench-settings-toggle"
					onClick={() => {
						if (isShowing) {
							actions.closePanel(settingsId);
							return;
						}

						actions.selectPanel(settingsId);
					}}
					className={cn(
						WORKBENCH_STYLES.chromeButton,
						isShowing
							? WORKBENCH_STYLES.chromeButtonActive
							: WORKBENCH_STYLES.chromeButtonInactive,
					)}
				>
					<SettingsIcon className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Settings</TooltipContent>
		</Tooltip>
	);
};
