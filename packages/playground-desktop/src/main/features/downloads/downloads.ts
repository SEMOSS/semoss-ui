import { app, type Session } from "electron";
import { join } from "node:path";

/**
 * Save downloads through the system's save dialog, starting in the user's
 * Downloads folder with the file's own name. Electron shows the dialog for
 * any download without a path; this only picks where it opens.
 *
 * @param session - The app's browser session.
 */
export const handleDownloads = (session: Session): void => {
	session.on("will-download", (_event, item) => {
		item.setSaveDialogOptions({
			defaultPath: join(app.getPath("downloads"), item.getFilename()),
		});
	});
};
