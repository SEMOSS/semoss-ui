import { SettingsIcon } from "lucide-react";
import type { ComponentProps } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ProjectDetailTabs } from "@/components/project";
import { useWorkbench } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { CHROME_BUTTON, CHROME_ICON } from "../core/workbench.chrome";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";

/**
 * Builds the settings blueprint for one project domain. Each domain calls
 * this at module scope with its static tab list, so the blueprint identity
 * stays stable and the panel never remounts from map churn.
 *
 * @name createProjectSettingsPanel
 * @param tabs - Settings tabs the domain exposes.
 * @return The blueprint registered under PROJECT_SETTINGS.
 */
export const createProjectSettingsPanel = (
	tabs: ComponentProps<typeof ProjectDetailTabs>["tabs"],
): WorkbenchPanelConfig => ({
	name: "Settings",
	helpText: "Settings",
	icon: ({ className }) => <SettingsIcon className={className} />,
	canClose: true,
	canRename: false,
	mount: "keepAlive",
	content: function ProjectSettingsContent() {
		return <ProjectDetailTabs tabs={tabs} />;
	},
});

/**
 * Toggles the shared project settings panel within a workbench — opening,
 * selecting, or closing it — and highlights while it is the shown tab.
 */
export const ProjectSettingsToggle: React.FC = () => {
	const actions = useWorkbench((state) => state.layout.actions);
	const settingsType = WORKBENCH_COMPONENTS.PROJECT_SETTINGS;

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
					data-testid="workbench-project-settings-toggle"
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
