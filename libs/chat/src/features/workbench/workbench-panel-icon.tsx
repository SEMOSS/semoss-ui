import { cn } from "@semoss/ui/next";
import type { WorkbenchPanelOption } from "./use-workbench-panels";

export interface WorkbenchPanelIconProps {
	/** The panel to draw. */
	place: WorkbenchPanelOption;
	/** Size classes. */
	className?: string;
}

/** A panel's icon, or the icon its integration gives it, such as an app's logo. */
export function WorkbenchPanelIcon({
	place,
	className,
}: WorkbenchPanelIconProps) {
	if (place.kind === "integration") {
		return (
			<span
				aria-hidden="true"
				className={cn("inline-flex shrink-0 *:size-full", className)}
			>
				{place.icon}
			</span>
		);
	}
	const Icon = place.icon;
	return <Icon aria-hidden="true" className={className} />;
}
