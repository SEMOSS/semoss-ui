import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import type {
	SettingsFile,
	WindowState,
} from "../server-connection/settings-file";

const DEFAULT_SIZE = { width: 1280, height: 820 };

/**
 * Whether a saved position still lands on a connected display, so a window
 * last shown on an unplugged monitor does not open off screen.
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
 * @param settings - Where the window's state is kept.
 * @returns The window, not yet showing a page.
 */
export const createMainWindow = (settings: SettingsFile): BrowserWindow => {
	const saved = settings.window;
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
		title: "SEMOSS Chat",
		backgroundColor: "#ffffff",
		webPreferences: {
			preload: join(__dirname, "../preload/preload.js"),
			contextIsolation: true,
			sandbox: true,
			nodeIntegration: false,
			spellcheck: true,
		},
	});
	if (saved?.isMaximized) window.maximize();
	window.once("ready-to-show", () => window.show());

	let timer: NodeJS.Timeout | undefined;
	const save = (): void => {
		const bounds = window.getNormalBounds();
		settings.setWindow({ ...bounds, isMaximized: window.isMaximized() });
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
