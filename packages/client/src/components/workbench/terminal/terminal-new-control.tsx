import { PlusIcon } from "lucide-react";
import type { FC } from "react";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchStoreApi,
	WorkbenchChromeButton,
} from "@semoss/workbench";
import { spawnTerminal } from "./spawn-terminal";

/**
 * Opens another independent terminal in the stack this one sits in. The new
 * tab is the same panel type as this terminal, so a project terminal opens
 * another project terminal.
 */
export const TerminalNewControl: FC<WorkbenchPanelProps> = ({ id }) => {
	const storeApi = useWorkbenchStoreApi();
	const type = useWorkbench((state) => state.layout.panels[id]?.type);

	if (!type) {
		return null;
	}

	return (
		<WorkbenchChromeButton
			icon={PlusIcon}
			label="New terminal"
			onClick={() => spawnTerminal(storeApi.getState().layout, type, id)}
			data-testid="workbench-new-terminal-button"
		/>
	);
};
