import { useEffect, useRef } from "react";
import { Button, useIsMobile } from "@semoss/ui/next";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { useToolWorkbench } from "../tool-workbench.context";

/** Right-hand dock that hosts selected message tools. */
export function ToolWorkbench() {
	const { snapshot, store, closeWorkbench } = useToolWorkbench();
	const backButton = useRef<HTMLButtonElement>(null);
	const isMobile = useIsMobile();
	useEffect(() => {
		if (isMobile) backButton.current?.focus();
	}, [isMobile]);

	return (
		<WorkbenchProvider store={store}>
			<div className="flex size-full min-h-0 flex-col">
				<Button
					ref={backButton}
					type="button"
					variant="ghost"
					className="shrink-0 md:hidden"
					onClick={closeWorkbench}
				>
					Back to conversation
				</Button>
				<div className="min-h-0 flex-1">
					<Workbench snapshot={snapshot} />
				</div>
			</div>
		</WorkbenchProvider>
	);
}
