import {
	type BrowserWindow,
	Menu,
	type MenuItemConstructorOptions,
} from "electron";
import {
	COMMAND_CHANNEL,
	type DesktopCommand,
} from "../../../contract/ipc-contract";

/**
 * The app's menu: New Chat and Change Server, the standard Edit menu (so copy
 * and paste work everywhere), View with reload, zoom, and the developer tools,
 * and the Window menu.
 *
 * @param window - The app's window, which the menu's commands go to.
 */
export const setAppMenu = (window: BrowserWindow): void => {
	const send = (command: DesktopCommand) => () =>
		window.webContents.send(COMMAND_CHANNEL, command);
	const isMac = process.platform === "darwin";

	const template: MenuItemConstructorOptions[] = [
		...(isMac ? [{ role: "appMenu" as const }] : []),
		{
			label: "File",
			submenu: [
				{
					label: "New Chat",
					accelerator: "CmdOrCtrl+N",
					click: send({ type: "new-chat" }),
				},
				{ type: "separator" },
				{
					label: "Change Server…",
					click: send({ type: "change-server" }),
				},
				{ type: "separator" },
				isMac ? { role: "close" } : { role: "quit" },
			],
		},
		{ role: "editMenu" },
		{
			label: "View",
			submenu: [
				{ role: "reload" },
				{ role: "forceReload" },
				{ role: "toggleDevTools" },
				{ type: "separator" },
				{ role: "resetZoom" },
				{ role: "zoomIn" },
				{ role: "zoomOut" },
				{ type: "separator" },
				{ role: "togglefullscreen" },
			],
		},
		{ role: "windowMenu" },
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};
