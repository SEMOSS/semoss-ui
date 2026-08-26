import { SettingsIcon } from "lucide-react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";

/**
 * Toggles the shared engine settings panel within a workbench — opening,
 * selecting, or closing it — and highlights while it is the shown tab.
 */
export const EngineSettingsToggle: React.FC = () => {
	const actions = useWorkbench((state) => state.layout.actions);
	const settingsType = WORKBENCH_COMPONENTS.ENGINE_SETTINGS;

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
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Settings"
					data-testid="workbench-settings-toggle"
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
