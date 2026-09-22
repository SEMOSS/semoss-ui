import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { TOOL_WORKBENCH_LAYOUT } from "../tool-workbench.constants";
import { useToolWorkbench } from "../tool-workbench.context";

/** Right-hand dock that hosts selected message tools. */
export function ToolWorkbench() {
	const { store } = useToolWorkbench();

	return (
		<WorkbenchProvider store={store}>
			<Workbench snapshot={TOOL_WORKBENCH_LAYOUT} />
		</WorkbenchProvider>
	);
}
