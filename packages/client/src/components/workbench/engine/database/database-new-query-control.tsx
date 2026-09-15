import { PlusIcon } from "lucide-react";
import type { FC } from "react";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { WorkbenchChromeButton } from "@semoss/workbench";
import { useDatabaseWorkbench } from "@/hooks";

/**
 * The query panel's chrome control. New Query is the query surface's own
 * action, so it rides the panel header rather than the workbench toolbar — it
 * appears beside whichever query tab is front, which is also the one it opens
 * a sibling of.
 */
export const DatabaseNewQueryControl: FC<WorkbenchPanelProps> = () => {
	const addQueryPanel = useDatabaseWorkbench((state) => state.addQueryPanel);

	return (
		<WorkbenchChromeButton
			icon={PlusIcon}
			label="New query"
			onClick={() => addQueryPanel("")}
			data-testid="workbench-new-query-button"
		/>
	);
};
