import { useState } from "react";
import { useSessionInsight } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

/** The engine subtypes whose export can leave out the data, which the user picks */
export const ENGINE_SUBTYPES_WITH_DATA = ["H2_DB"];

/** What {@link useEngineExport} gives its caller. */
export interface UseEngineExportResult {
	/** Whether an export is running */
	isExporting: boolean;
	/**
	 * Exports the engine as a zip and downloads it, reporting a failure in a
	 * toast.
	 *
	 * @param includeData - Whether to include the database's data
	 */
	exportEngine: (includeData: boolean) => Promise<void>;
}

/**
 * Exports an engine (ExportEngine) and downloads the zip, tracking whether the
 * export is running. Only the engine's owners can export it.
 *
 * @param engineId - The engine to export.
 * @returns The export action and its state.
 */
export const useEngineExport = (engineId: string): UseEngineExportResult => {
	// the export makes the zip in an insight, which its download must share
	const { run, download } = useSessionInsight();
	const [isExporting, setIsExporting] = useState(false);

	const exportEngine = async (includeData: boolean) => {
		setIsExporting(true);
		try {
			const response = await run(
				`META | ExportEngine(engine=[${JSON.stringify(engineId)}], includeData="${includeData ? "true" : "false"}" );`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			await download(response.pixelReturn[0].output as string);
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
