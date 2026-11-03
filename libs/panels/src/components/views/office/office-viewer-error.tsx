import { DownloadIcon } from "lucide-react";
import { Button, Muted } from "@semoss/ui/next";

interface OfficeViewerErrorProps {
	/** Persistent load failure, including parser failures. */
	message: string;
	/** Whether the original saved file is being downloaded. */
	isDownloading: boolean;
	/** Downloads the original file through the existing panel action. */
	onDownload: () => void;
}

/** Keeps the saved file available when an Office viewer cannot open it. */
export const OfficeViewerError = ({
	message,
	isDownloading,
	onDownload,
}: OfficeViewerErrorProps) => (
	<div className="flex size-full min-w-0 flex-col items-center justify-center gap-4 overflow-auto bg-background p-4 text-center">
		<Muted
			className="max-w-prose break-words text-destructive"
			role="alert"
		>
			{message}
		</Muted>
		<Button type="button" onClick={onDownload} disabled={isDownloading}>
			<DownloadIcon aria-hidden className="size-4" />
			{isDownloading ? "Downloading" : "Download file"}
		</Button>
	</div>
);
