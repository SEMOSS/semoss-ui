import type { FC } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { WorkbenchChromeProps } from "@semoss/workbench";
import { WORKBENCH_STYLES } from "@semoss/workbench";
import type { FileDownloadParams } from "./file-download-panel";

export type FileDownloadViewMode = "download" | "raw";

export interface FileDownloadControlValue {
	setViewMode: (mode: FileDownloadViewMode) => void;
	viewMode: FileDownloadViewMode;
}

/** Switch a download-only file between download and raw views. */
export const FileDownloadControl: FC<
	WorkbenchChromeProps<FileDownloadParams, FileDownloadControlValue>
> = ({ value }) => {
	if (!value) return null;

	return (
		<Select
			value={value.viewMode}
			onValueChange={(mode) =>
				value.setViewMode(mode as FileDownloadViewMode)
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
