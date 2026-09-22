import { X } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { TOOL_WORKBENCH_LAYOUT } from "../tool-workbench.constants";
import { useToolWorkbench } from "../tool-workbench.context";

/** Right-hand dock that hosts selected message tools. */
export function ToolWorkbench() {
	const { store, closeWorkbench } = useToolWorkbench();

	return (
		<WorkbenchProvider store={store}>
			<Workbench
				snapshot={TOOL_WORKBENCH_LAYOUT}
				borderSlots={{
					top: {
						after: (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label="Close tool workbench"
										onClick={closeWorkbench}
									>
										<X aria-hidden="true" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									Close tool workbench
								</TooltipContent>
							</Tooltip>
						),
					},
				}}
			/>
		</WorkbenchProvider>
	);
}
