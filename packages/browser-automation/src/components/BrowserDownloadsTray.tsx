import { AlertTriangle, Check, Download, LoaderCircle } from "lucide-react";
import { Button } from "@semoss/ui/next";
import type { BrowserDownload, DownloadError } from "../types/browserEvents";

interface BrowserDownloadsTrayProps {
	downloads: BrowserDownload[];
	errors: DownloadError[];
	open: boolean;
	onToggle: () => void;
}

const formatBytes = (size?: number): string => {
	if (!size || size < 1024) return size ? `${size} B` : "";
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const statusLabel = (download: BrowserDownload): string => {
	switch (download.status) {
		case "saved":
			return download.insightPath || "Saved to insight";
		case "ready":
			return "Saving to insight";
		case "downloading":
			return "Downloading";
		default:
			return download.error || "Download failed";
	}
};

export function BrowserDownloadsTray({
	downloads,
	errors,
	open,
	onToggle,
}: BrowserDownloadsTrayProps) {
	const count =
		downloads.length + errors.filter((error) => !error.downloadId).length;
	return (
		<div className="relative">
			<Button
				size="sm"
				variant={open ? "default" : "outline"}
				onClick={onToggle}
				aria-label="Show browser downloads"
			>
				<Download />
				Downloads ({count})
			</Button>
			{open && (
				<div className="absolute top-full right-0 z-50 mt-1 max-h-96 w-[min(28rem,calc(100vw-1rem))] overflow-auto rounded-md border border-line bg-surface-raised p-2 shadow-xl">
					{downloads.length === 0 && errors.length === 0 ? (
						<div className="p-3 text-muted text-sm">
							No browser downloads
						</div>
					) : (
						<div className="space-y-1">
							{downloads.map((download) => (
								<div
									key={download.downloadId}
									className="rounded border border-line bg-canvas px-2 py-1.5 text-xs"
								>
									<div className="flex items-center gap-1.5 font-medium">
										{download.status === "saved" ? (
											<Check className="text-success" />
										) : download.status === "ready" ||
											download.status ===
												"downloading" ? (
											<LoaderCircle className="animate-spin text-accent" />
										) : (
											<AlertTriangle className="text-danger" />
										)}
										<span className="min-w-0 flex-1 truncate">
											{download.fileName}
										</span>
										<span className="text-muted">
											{formatBytes(download.sizeBytes)}
										</span>
									</div>
									<div className="mt-0.5 truncate text-muted">
										{statusLabel(download)}
									</div>
								</div>
							))}
							{errors.map((error, index) => (
								<div
									key={`${error.downloadId || "error"}-${index}`}
									className="rounded border border-danger/40 bg-danger/5 px-2 py-1.5 text-danger text-xs"
								>
									<div className="flex items-center gap-1.5 font-medium">
										<AlertTriangle />
										<span className="truncate">
											{error.fileName ||
												error.downloadId ||
												"Browser download"}
										</span>
									</div>
									<div className="mt-0.5">{error.error}</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
