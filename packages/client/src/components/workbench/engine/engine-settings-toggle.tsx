import { SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { WORKBENCH_COMPONENTS } from "../workbench.contants";

interface EngineSettingsToggleProps {
	/** Workbench layout model whose settings tab is toggled */
	model: FlexLayout.Model;
}

/**
 * Toggles the shared engine settings tab within a workbench layout — opening,
 * selecting, or closing it — and highlights while it is the active tab.
 */
export const EngineSettingsToggle: React.FC<EngineSettingsToggleProps> = ({
	model,
}) => {
	// FlexLayout's model is not observable — re-render on change so the toggle
	// reflects the settings tab being opened, selected, closed, or moved.
	const [, setKey] = useState(0);

	useEffect(() => {
		const listener = () => setKey((key) => key + 1);
		model.addChangeListener(listener);
		return () => model.removeChangeListener(listener);
	}, [model]);

	const isSettingsOpen =
		model.getNodeById(WORKBENCH_COMPONENTS.ENGINE_SETTINGS) instanceof
		FlexLayout.TabNode;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Settings"
					data-testid="workbench-settings-toggle"
					onClick={() => {
						const settingsId = WORKBENCH_COMPONENTS.ENGINE_SETTINGS;

						const node = model.getNodeById(settingsId);

						if (node instanceof FlexLayout.TabNode) {
							const parent = node.getParent();

							if (parent instanceof FlexLayout.TabSetNode) {
								if (
									parent.getSelectedNode()?.getId() ===
									settingsId
								) {
									model.doAction(
										FlexLayout.Actions.deleteTab(
											settingsId,
										),
									);
									return;
								}

								model.doAction(
									FlexLayout.Actions.selectTab(settingsId),
								);
								return;
							}

							// Dragged into a border — remove it so it reopens as a full tab.
							model.doAction(
								FlexLayout.Actions.deleteTab(settingsId),
							);
						}

						const targetTabsetId =
							model.getActiveTabset()?.getId() ??
							model.getRoot().getChildren()[0]?.getId() ??
							"";

						if (!targetTabsetId) {
							return;
						}

						model.doAction(
							FlexLayout.Actions.addNode(
								{
									type: "tab",
									id: settingsId,
									name: "Settings",
									component: settingsId,
									enableClose: true,
								},
								targetTabsetId,
								FlexLayout.DockLocation.CENTER,
								-1,
								true,
							),
						);
					}}
					className={cn(
						"border",
						isSettingsOpen
							? "border-input text-primary shadow-xs dark:bg-input/30"
							: "border-transparent text-muted-foreground",
					)}
				>
					<SettingsIcon className="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Settings</TooltipContent>
		</Tooltip>
	);
};
