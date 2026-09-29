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
	const settingsType = WORKBENCH_COMPONENTS.PROJECT_SETTINGS;

	// panelSlots and closePanel are keyed by the runtime panel id, not the
	// blueprint type, so the open instance has to be resolved first.
	const existingId = useWorkbench(
		(state) =>
			Object.values(state.layout.panels).find(
				(record) => record.type === settingsType,
			)?.id,
	);
	const isShowing = useWorkbench((state) =>
		existingId
			? (state.layout.panelSlots[existingId]?.active ?? false)
			: false,
	);

	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Settings"
					data-testid="automation-workbench-settings-toggle"
					onClick={() => {
						if (existingId && isShowing) {
							actions.closePanel(existingId);
							return;
						}

						actions.selectPanel(settingsType);
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
