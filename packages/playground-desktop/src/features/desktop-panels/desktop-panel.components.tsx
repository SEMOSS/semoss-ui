import { GlobeIcon } from "lucide-react";
import type { RoomIntegrationFactory } from "@semoss/chat";
import { getI18n } from "@semoss/i18n";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { BrowserPanel, type BrowserPanelConfig } from "./browser-panel";

/** The desktop panels' types in a room's Workspace. */
export const DESKTOP_PANEL_TYPES = {
	BROWSER: "desktop-browser",
} as const;

/**
 * The browser panel's blueprint. Kept alive, as the workbench requires for a
 * frame: unmounting it would reload the page.
 */
export const BROWSER_PANEL: WorkbenchPanelConfig<BrowserPanelConfig> = {
	name: "Browser",
	icon: ({ className }) => <GlobeIcon aria-hidden className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: BrowserPanel,
};

/** The desktop panels' blueprints, by type, for the Workspace. */
export const BROWSER_PANEL_COMPONENTS = {
	[DESKTOP_PANEL_TYPES.BROWSER]: BROWSER_PANEL,
};

/**
 * Puts the browser panel on every room's Workspace rail and in its Open a
 * Panel menu.
 *
 * @returns The integration's factory.
 */
export const createDesktopPanelsIntegration =
	(): RoomIntegrationFactory => () => ({
		id: "desktop-panels",
		getRailPanels: () => [
			{
				type: DESKTOP_PANEL_TYPES.BROWSER,
				name: getI18n()?.t("desktop:browser.name") ?? "Browser",
				icon: <GlobeIcon aria-hidden />,
			},
		],
		ownsPanelType: (type) => type === DESKTOP_PANEL_TYPES.BROWSER,
	});
