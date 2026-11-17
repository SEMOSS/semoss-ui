import { BrowserWindow, type Session, screen } from "electron";
import { join } from "node:path";
import type {
	DesktopConfigFile,
	WindowState,
} from "../server-connection/desktop-config";

/** The first launch's window size. */
const DEFAULT_SIZE = { width: 1280, height: 820 };

/**
 * Whether a saved position still lands on a connected display, so a window
 * last shown on an unplugged monitor does not open off screen.
 *
 * @param state - The saved window state.
 * @returns True when the saved bounds overlap a display's work area.
 */
const isOnScreen = ({ x, y, width, height }: WindowState): boolean =>
	x !== undefined &&
	y !== undefined &&
	screen.getAllDisplays().some(({ workArea }) => {
		return (
			x + width > workArea.x &&
			x < workArea.x + workArea.width &&
			y + height > workArea.y &&
			y < workArea.y + workArea.height
		);
	});

/**
 * Open the app's window where it last was, and remember where it is as it
 * moves, resizes, and closes.
 *
 * @param config - Where the window's state is kept.
 * @param serverSession - The browser session of the server it shows.
 * @returns The window, not yet showing a page.
 */
export const createMainWindow = (
	config: DesktopConfigFile,
	serverSession: Session,
): BrowserWindow => {
	const saved = config.window;
	const placement =
		saved && isOnScreen(saved)
			? {
					x: saved.x,
					y: saved.y,
					width: saved.width,
					height: saved.height,
				}
			: {
					...DEFAULT_SIZE,
					...(saved
						? { width: saved.width, height: saved.height }
						: {}),
				};

	const window = new BrowserWindow({
		...placement,
		minWidth: 480,
		minHeight: 360,
		show: false,
		title: "Playground",
		backgroundColor: "#ffffff",
		webPreferences: {
			session: serverSession,
			preload: join(__dirname, "../preload/preload.js"),
			contextIsolation: true,
			sandbox: true,
			nodeIntegration: false,
			spellcheck: true,
		},
	});
	if (saved?.isMaximized) window.maximize();
	window.once("ready-to-show", () => window.show());

	// moving and resizing fire many events; save once they settle
	let timer: NodeJS.Timeout | undefined;
	const save = (): void => {
		const bounds = window.getNormalBounds();
		config.setWindow({ ...bounds, isMaximized: window.isMaximized() });
	};
	const saveSoon = (): void => {
		clearTimeout(timer);
		timer = setTimeout(save, 500);
	};
	window.on("resize", saveSoon);
	window.on("move", saveSoon);
	window.on("close", () => {
		clearTimeout(timer);
		save();
	});

	return window;
};
