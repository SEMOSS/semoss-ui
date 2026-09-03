import type { FC } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";

export type EngineFileDownloadViewMode = "download" | "raw";

export interface EngineFileDownloadViewerControlValue {
	setViewMode: (mode: EngineFileDownloadViewMode) => void;
	viewMode: EngineFileDownloadViewMode;
}

/** Switch an engine download-only file between download and raw views. */
export const EngineFileDownloadViewerControl: FC<
	WorkbenchChromeProps<
		WorkbenchPanelParams,
		EngineFileDownloadViewerControlValue
	>
> = ({ value }) => {
	if (!value) return null;

	return (
		<Select
			value={value.viewMode}
			onValueChange={(mode) =>
				value.setViewMode(mode as EngineFileDownloadViewMode)
			}
		>
			<SelectTrigger
				className={WORKBENCH_STYLES.chromeSelect}
				aria-label="File view"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="download">Download</SelectItem>
				<SelectItem value="raw">Raw</SelectItem>
			</SelectContent>
		</Select>
	);
};
