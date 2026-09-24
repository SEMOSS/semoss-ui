import { SaveIcon } from "lucide-react";
import type { FC } from "react";
import { Spinner } from "@semoss/ui/next";
import type {
	WorkbenchPanelParams,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchPanel, WorkbenchChromeButton } from "@semoss/workbench";
import type { AgentEditorSaveValue } from "./agent-editor-panel";

/**
 * The agent editor's chrome control. `AgentEditorPanel` publishes its save
 * state through the panel's scratch `value` (see its `setValue` call) rather
 * than rendering an in-body toolbar, so Save rides the tab strip like every
 * other panel's control.
 */
export const AgentEditorSaveControl: FC<WorkbenchPanelProps> = ({ id }) => {
	const { value } = useWorkbenchPanel<
		WorkbenchPanelParams,
		AgentEditorSaveValue
	>(id);

	const isLoading = value?.isLoading ?? false;
	const isFetching = value?.isFetching ?? false;
	if (!value || value.readOnly) {
		return null;
	}

	return (
		<WorkbenchChromeButton
			icon={isLoading ? Spinner : SaveIcon}
			label="Save agent"
			onClick={value.onSave}
			disabled={isLoading || isFetching}
			data-testid="agent-editor-save-button"
		/>
	);
};
