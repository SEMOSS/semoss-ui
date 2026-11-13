import type { ConnectorAccount } from "@semoss/connectors";
import { type ConnectorBrand, ConnectorBrandIcon } from "@semoss/shared";
import { useWorkbench, type WorkbenchPanelIconProps } from "@semoss/workbench";
import type { ConnectorPanelConfig } from "./room-connectors.types";

const BRANDS: Record<
	"mail" | "calendar",
	Record<ConnectorAccount, ConnectorBrand>
> = {
	mail: { microsoft: "outlook", google: "gmail" },
	calendar: { microsoft: "outlook-calendar", google: "google-calendar" },
};

interface ConnectorPanelIconProps extends WorkbenchPanelIconProps {
	/** What the tab shows. */
	app: keyof typeof BRANDS;
}

/** A mail or calendar tab's logo: the app of the account the tab was opened for. */
export function ConnectorPanelIcon({
	id,
	className,
	app,
}: ConnectorPanelIconProps) {
	// a narrow selector, as the workbench's own icon uses: the whole panel
	// changes on every value write, which would redraw every tab's logo
	const provider = useWorkbench(
		(state) =>
			(
				state.layout.panels[id]?.config as
					| Partial<ConnectorPanelConfig>
					| undefined
			)?.provider,
	);
	return (
		<ConnectorBrandIcon
			brand={BRANDS[app][provider ?? "microsoft"]}
			className={className}
		/>
	);
}
