import type { RouteObject } from "react-router-dom";
import { SettingsHomePage } from "./settings-home-page";
import { SettingsThemePage } from "./settings-theme-page";

export const SETTINGS_ROUTES: RouteObject[] = [
	{
		id: "", // skip the id for the default route. This means it won't show up.
		path: "",
		element: <SettingsHomePage />,
	},
	{
		id: "User",
		path: "user",
		element: <div>User Settings Page - Coming Soon</div>,
	},
	{
		id: "Theme",
		path: "theme",
		element: <SettingsThemePage />,
	},
];
