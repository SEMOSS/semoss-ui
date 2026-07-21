import { BrowserWindow, type BrowserWindowConstructorOptions } from "electron";
import { join } from "node:path";
import { APP_NAME, APP_WINDOW_SIZE } from "../app-info";

// See https://www.electronjs.org/docs/latest/tutorial/custom-title-bar.
// Height must match title-bar.tsx's h-10 (40px) so native controls line up
// with the in-page draggable strip instead of looking like two bars.
const TITLE_BAR_HEIGHT = 40;

function platformTitleBarOptions(): Partial<BrowserWindowConstructorOptions> {
	if (process.platform === "darwin") {
		return {
			titleBarStyle: "hidden",
			trafficLightPosition: { x: 16, y: (TITLE_BAR_HEIGHT - 16) / 2 },
		};
	}

	// TODO: titleBarOverlay's colors are fixed at window-creation time — they
	// won't follow the in-app theme toggle (ThemeProvider) without calling
	// win.setTitleBarOverlay() again on theme change.
	return {
		titleBarStyle: "hidden",
		titleBarOverlay: {
			color: "#ffffff",
			symbolColor: "#00000099",
			height: TITLE_BAR_HEIGHT,
		},
	};
}

export function createMainWindow(): BrowserWindow {
	const win = new BrowserWindow({
		...APP_WINDOW_SIZE,
		...platformTitleBarOptions(),
		title: APP_NAME,
		icon: join(__dirname, "..", "..", "build", "icon.png"),
		webPreferences: {
			// app-ui is our own code (not a third-party page), so — unlike the
			// earlier playground-wrapping approach — it's safe to give it the
			// same connections bridge the connections window uses, for the
			// in-app "current connection" indicator / instance switcher.
			preload: join(__dirname, "..", "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	return win;
}
