import { ConnectorBrandIcon } from "@semoss/shared";
import type { WorkbenchPanelOption } from "./use-workbench-panels";

/** Props for {@link WorkbenchPanelIcon}. */
interface WorkbenchPanelIconProps {
	/** The panel whose icon to draw. */
	panel: WorkbenchPanelOption;
	/** Size classes. */
	className?: string;
}

/** A panel's icon, or its app's logo for a connector viewer. */
export function WorkbenchPanelIcon({
	panel,
	className,
}: WorkbenchPanelIconProps) {
	if (panel.kind === "connector") {
		return <ConnectorBrandIcon brand={panel.brand} className={className} />;
	}
	const Icon = panel.icon;
	return <Icon aria-hidden="true" className={className} />;
}
