import { SettingsIcon } from "lucide-react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { CHROME_BUTTON, CHROME_ICON } from "../core/workbench.chrome";
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
						"border",
						CHROME_BUTTON,
						isShowing
							? "border-input text-primary shadow-xs dark:bg-input/30"
							: "border-transparent text-muted-foreground",
					)}
				>
					<SettingsIcon className={CHROME_ICON} />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Settings</TooltipContent>
		</Tooltip>
	);
};
