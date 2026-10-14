import { type ConnectorBrand, ConnectorBrandIcon } from "@semoss/shared";
import { useWorkbench, type WorkbenchPanelId } from "@semoss/workbench";

/** What a connector panel can be opened with. */
export interface ConnectorViewerPanelParams {
	/**
	 * The app whose logo the tab shows, when it is not the viewer's own, such
	 * as one mail viewer shown as Outlook or as Gmail. Part of the panel's
	 * identity, so each brand opens its own tab.
	 */
	brand?: ConnectorBrand;
}

/** Props for {@link ConnectorPanelIcon}. */
export interface ConnectorPanelIconProps {
	/** The panel whose tab it is. */
	id: WorkbenchPanelId;
	/** The logo when the panel was opened without a brand of its own. */
	brand: ConnectorBrand;
	/** The size the workbench has room for. */
	className: string;
}

/** A connector panel's tab logo: the brand it was opened with, or its own. */
export const ConnectorPanelIcon = ({
	id,
	brand,
	className,
}: ConnectorPanelIconProps) => {
	// a narrow selector, as the workbench's own icon uses: the whole panel
	// changes on every value write, which would redraw every tab's logo
	const openedWith = useWorkbench(
		(state) =>
			(
				state.layout.panels[id]?.config as
					| ConnectorViewerPanelParams
					| undefined
			)?.brand,
	);
	return (
		<ConnectorBrandIcon brand={openedWith ?? brand} className={className} />
	);
};
