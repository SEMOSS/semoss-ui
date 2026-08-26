import { useWorkbench } from "@/hooks";
import type { WorkbenchBorderSlot } from "./workbench.types";
import { resolveBorderSlot } from "./workbench-border";
import { WorkbenchResetButton } from "./workbench-reset-button";

export interface WorkbenchMobileActionsProps {
	/** The left rail's `after` slot, as the host supplied it. */
	slot?: WorkbenchBorderSlot;

	/** When true, the reset control is hidden. */
	readOnly?: boolean;
}

/**
 * The mobile layout draws no rails, so the left rail's `after` slot and the
 * reset control float over the bottom-left instead. Renders nothing on the
 * desktop layout, where both sit in the rail itself.
 */
export const WorkbenchMobileActions = ({
	slot,
	readOnly = false,
}: WorkbenchMobileActionsProps) => {
	const isMobileLayout = useWorkbench((state) => state.layout.isMobileLayout);
	if (!isMobileLayout) {
		return null;
	}

	// No rail to describe here, but the float below stacks its content in a
	// column — the same axis as the left rail the slot came from — so the slot
	// is told it is vertical, and closed.
	const content = resolveBorderSlot(slot, {
		side: "left",
		vertical: true,
		open: false,
		panelIds: [],
	});
	if (readOnly && !content) {
		return null;
	}

	return (
		<div className="absolute bottom-3 left-2 z-10">
			<div className="flex flex-col gap-1">
				{content}
				{readOnly ? null : <WorkbenchResetButton />}
			</div>
		</div>
	);
};
