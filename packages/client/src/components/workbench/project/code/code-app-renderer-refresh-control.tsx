import { RefreshCw } from "lucide-react";
import type { FC } from "react";
import type {
	WorkbenchPanelParams,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchPanel, WorkbenchChromeButton } from "@semoss/workbench";

/**
 * The app preview's chrome control. Bumping the panel's scratch value rekeys
 * the iframe, which is what a manual refresh means here.
 *
 * The counter lives on the panel's `value` rather than in the panel's own
 * `useState` because a control draws in the chrome's subtree: it cannot share
 * a setter with its panel, and the store round-trip re-renders both.
 */
export const CodeAppRendererRefreshControl: FC<WorkbenchPanelProps> = ({
	id,
}) => {
	const { setValue } = useWorkbenchPanel<WorkbenchPanelParams, number>(id);

	return (
		<WorkbenchChromeButton
			icon={RefreshCw}
			label="Refresh app"
			tooltip="Refresh"
			onClick={() => setValue((count = 0) => count + 1)}
			data-testid="workbench-app-renderer-refresh"
		/>
	);
};
