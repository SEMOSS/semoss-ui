import { useState } from "react";
import { download, runPixel, useSessionInsight } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

/** What {@link useEngineExport} gives its caller. */
interface UseEngineExportResult {
	/** Whether an export is running */
	isExporting: boolean;
	/**
	 * Exports the engine as a zip and downloads it, reporting a failure in a
	 * toast. The zip holds the engine's folder, so an engine that keeps its
	 * data in files, such as an H2 or RDF database, comes with its data.
	 */
	exportEngine: () => Promise<void>;
}

/**
 * Exports an engine (ExportEngine) and downloads the zip, tracking whether the
 * export is running. Only the engine's owners can export it.
 *
 * @param engineId - The engine to export.
 * @returns The export action and its state.
 */
export const useEngineExport = (engineId: string): UseEngineExportResult => {
	const { insightId } = useSessionInsight();
	const [isExporting, setIsExporting] = useState(false);

	const exportEngine = async () => {
		setIsExporting(true);
		try {
			const response = await runPixel(
				`META | ExportEngine(engine=[${JSON.stringify(engineId)}]);`,
				insightId,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			await download(insightId, response.pixelReturn[0].output as string);
		} catch (error) {
			toast.error(
				getErrorMessage(error, "Failed to export. Please try again."),
			);
		} finally {
			setIsExporting(false);
		}
	};

	return { isExporting, exportEngine };
};
