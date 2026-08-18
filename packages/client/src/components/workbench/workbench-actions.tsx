import type { ReactNode } from "react";
import type { FlexLayout } from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { WorkbenchResetButton } from "./workbench-reset-button";

export interface WorkbenchActionsProps {
	/** Feature-specific actions displayed above the command menu button. */
	actions?: ReactNode;

	/** Default layout the reset action restores. */
	layout: FlexLayout.IJsonModel;

	/** When true, the reset control is hidden. */
	readOnly?: boolean;
}

/** Renders the workbench's floating actions and command menu control. */
export const WorkbenchActions = ({
	actions,
	layout,
	readOnly = false,
}: WorkbenchActionsProps) => {
	useWorkbench((state) => state.key);
	const model = useWorkbench((state) => state.model);

	const hasBottomBorder = model
		.getBorderSet()
		.getBorders()
		.some((border) => border.getLocation().getName() === "bottom");

	return (
		<div
			className={cn(
				"absolute left-2 z-10",
				hasBottomBorder ? "bottom-14" : "bottom-2",
			)}
		>
			<div className="flex flex-col gap-1">
				{actions}
				{readOnly ? null : <WorkbenchResetButton layout={layout} />}
			</div>
		</div>
	);
};
