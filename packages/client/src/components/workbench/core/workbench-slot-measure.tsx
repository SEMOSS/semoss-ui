import { type FC, useLayoutEffect } from "react";
import { useWorkbench } from "@/hooks";

/**
 * Re-measures slot geometry in the layout phase after any commit that can move
 * a slot. Panel bodies are absolutely positioned from those measurements, so
 * without this they keep their old rect while the dock frames reflow.
 *
 * It lives in its own leaf rather than in the shell because the shell reads
 * none of these fields: subscribing it would re-render every border, the panel
 * layer, and the drag layer on each of the ~60 commits a splitter drag makes.
 * Rendered last inside the root, so React's depth-first commit has already
 * attached every slot ref by the time this effect runs.
 */
export const WorkbenchSlotMeasure: FC = () => {
	const actions = useWorkbench((s) => s.layout.actions);
	// subscribed for the re-render, not for the values: each of these is a way
	// a slot can move
	useWorkbench((s) => s.layout.tree);
	useWorkbench((s) => s.layout.borders);
	useWorkbench((s) => s.layout.maximizedTabsetId);
	useWorkbench((s) => s.layout.isMobileLayout);
	useWorkbench((s) => s.layout.panelSlots);

	// no dependency array: this component renders only when one of the
	// subscriptions above changed, which is exactly when slots need re-measuring
	useLayoutEffect(() => {
		actions.measureSlots();
	});

	return null;
};
