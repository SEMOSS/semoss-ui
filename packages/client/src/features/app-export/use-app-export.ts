import { useState } from "react";
import { download, runPixel } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

/** What {@link useAppExport} gives its caller. */
export interface UseAppExportResult {
	/** Whether an export is running */
	isExporting: boolean;
	/** Exports the app as a zip and downloads it, reporting a failure in a toast */
	exportApp: () => Promise<void>;
}

/**
 * Exports an app (ExportProjectApp) and downloads the zip, tracking whether the
 * export is running. Only the app's owners can export it.
 *
 * @param appId - The app to export.
 * @returns The export action and its state.
 */
export const useAppExport = (appId: string): UseAppExportResult => {
	const [isExporting, setIsExporting] = useState(false);

	const exportApp = async () => {
		setIsExporting(true);
		try {
			const response = await runPixel(
				`ExportProjectApp(project=${JSON.stringify([appId])});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			await download(
				response.insightId,
				response.pixelReturn[0].output as string,
			);
		} catch (error) {
			toast.error(
				getErrorMessage(
					error,
					"Failed to export the app. Please try again.",
				),
			);
		} finally {
			setIsExporting(false);
		}
	};

	return { isExporting, exportApp };
};
