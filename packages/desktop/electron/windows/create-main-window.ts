import { BrowserWindow, type BrowserWindowConstructorOptions } from "electron";
import { join } from "node:path";
import { APP_NAME, APP_WINDOW_SIZE } from "../app-info";
import { getIconPath } from "../icon-path";

// See https://www.electronjs.org/docs/latest/tutorial/custom-title-bar.
// Height must match title-bar.tsx's h-10 (40px) so native controls line up
// with the in-page draggable strip instead of looking like two bars.
const TITLE_BAR_HEIGHT = 40;

// macOS's own traffic-light control diameter, used only to vertically
// center them within TITLE_BAR_HEIGHT — not a size we control ourselves.
const MAC_TRAFFIC_LIGHT_DIAMETER = 16;

// Windows titleBarOverlay colors — light-theme values (see the TODO below
// for why these can't yet follow the in-app theme toggle).
const WIN_TITLE_BAR_BACKGROUND = "#ffffff";
const WIN_TITLE_BAR_SYMBOL_COLOR = "#00000099";

function platformTitleBarOptions(): Partial<BrowserWindowConstructorOptions> {
	if (process.platform === "darwin") {
		return {
			titleBarStyle: "hidden",
			trafficLightPosition: {
				x: MAC_TRAFFIC_LIGHT_DIAMETER,
				y: (TITLE_BAR_HEIGHT - MAC_TRAFFIC_LIGHT_DIAMETER) / 2,
			},
		};
	}

	// TODO: titleBarOverlay's colors are fixed at window-creation time — they
	// won't follow the in-app theme toggle (ThemeProvider) without calling
	// win.setTitleBarOverlay() again on theme change.
	return {
		titleBarStyle: "hidden",
		titleBarOverlay: {
			color: WIN_TITLE_BAR_BACKGROUND,
			symbolColor: WIN_TITLE_BAR_SYMBOL_COLOR,
			height: TITLE_BAR_HEIGHT,
		},
	};
}

export function createMainWindow(): BrowserWindow {
	const win = new BrowserWindow({
		...APP_WINDOW_SIZE,
		...platformTitleBarOptions(),
		title: APP_NAME,
		icon: getIconPath(),
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
