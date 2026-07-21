import { app } from "electron";
import { join } from "node:path";

/**
 * packages/desktop's own app icon. Resolved from `app.getAppPath()` (the
 * directory containing this package's package.json, in both dev and a
 * packaged build) rather than a `join(__dirname, "..", ...)` chain, since
 * the right number of ".." segments differs depending on which compiled
 * file under dist-electron/ is asking — this way every caller gets the
 * same answer.
 *
 * Kept out of app-info.ts on purpose: this needs `electron`/`node:path`,
 * and app-info.ts's other constants (APP_NAME, etc.) are imported directly
 * by app-ui's renderer code (title-bar.tsx), which Vite bundles for the
 * browser — it can't resolve Electron/Node built-ins there.
 */
export function getIconPath(): string {
	return join(app.getAppPath(), "build", "icon.png");
}
