import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { useToolWorkbench } from "../tool-workbench.context";

/** Right-hand dock that hosts selected message tools. */
export function ToolWorkbench() {
	const { snapshot, store } = useToolWorkbench();

	return (
		<WorkbenchProvider store={store}>
			<Workbench snapshot={snapshot} />
		</WorkbenchProvider>
	);
}
