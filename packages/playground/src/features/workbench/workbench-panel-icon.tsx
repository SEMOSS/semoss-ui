import { ConnectorBrandIcon } from "@semoss/shared";
import type { WorkbenchPanelOption } from "./use-workbench-panels";

export interface WorkbenchPanelIconProps {
	/** The panel to draw. */
	place: WorkbenchPanelOption;
	/** Size classes. */
	className?: string;
}

/** A panel's icon, or its app's logo for a connector viewer. */
export function WorkbenchPanelIcon({
	place,
	className,
}: WorkbenchPanelIconProps) {
	if (place.kind === "connector") {
		return <ConnectorBrandIcon brand={place.brand} className={className} />;
	}
	const Icon = place.icon;
	return <Icon aria-hidden="true" className={className} />;
}
