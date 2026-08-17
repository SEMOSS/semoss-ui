import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";

export interface WorkbenchActionsProps {
	/** Feature-specific actions displayed above the command menu button. */
	actions?: ReactNode;
}

/** Renders the workbench's floating actions and command menu control. */
export const WorkbenchActions = ({ actions }: WorkbenchActionsProps) => {
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
			<div className="flex flex-col gap-1">{actions}</div>
		</div>
	);
};
