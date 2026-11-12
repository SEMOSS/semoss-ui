import { AutomationSourceExplorerPanel } from "@semoss/automation";
import { Button } from "@semoss/ui/next";
import { useWorkbench, type WorkbenchComponent } from "@semoss/workbench";

export const AUTOMATION_SOURCE_EXPLORER_FULL =
	"automation-source-explorer-full";

/**
 * Keeps the docked explorer lightweight while its full workbench tab exists.
 * This prevents two retained history tables from polling the same run data.
 */
export const AutomationSourceExplorerDockedPanel: WorkbenchComponent = () => {
	const actions = useWorkbench((state) => state.layout.actions);
	const fullViewOpen = useWorkbench((state) =>
		state.layout.openPanelIds.some(
			(panelId) =>
				state.layout.panels[panelId]?.type ===
				AUTOMATION_SOURCE_EXPLORER_FULL,
		),
	);

	if (!fullViewOpen) {
		return <AutomationSourceExplorerPanel />;
	}

	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
			<p className="font-medium text-sm">
				Source Explorer is open in the main workspace.
			</p>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() =>
					actions.selectPanel(AUTOMATION_SOURCE_EXPLORER_FULL)
				}
			>
				Focus full view
			</Button>
		</div>
	);
};

/** Renders the sole retained explorer instance without a recursive full-view action. */
export const AutomationSourceExplorerFullPanel: WorkbenchComponent = () => (
	<AutomationSourceExplorerPanel fullView />
);
