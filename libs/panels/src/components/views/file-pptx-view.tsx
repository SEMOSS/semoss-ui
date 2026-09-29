import { DownloadIcon } from "lucide-react";
import type { PowerPointViewerHandle } from "pptx-react-viewer";
import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { decodeBase64Asset, encodeBase64Asset } from "@semoss/shared";
import { Button, Muted, Spinner } from "@semoss/ui/next";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";

const FilePptxViewContent = lazy(() =>
	import("./file-pptx-view-content").then((m) => ({
		default: m.FilePptxViewContent,
	})),
);

/** Preview and edit a PowerPoint file from a project, engine, or user resource. */
export const FilePptxView = ({ config, onControls }: FileViewProps) => {
	const panel = useFilePanel(config, { base64: true });
	const viewerRef = useRef<PowerPointViewerHandle>(null);
	const [isDirty, setIsDirty] = useState(false);
	const content = useMemo(
		() => decodeBase64Asset(panel.read.data),
		[panel.read.data],
	);

	// The deck is edited in the viewer's own memory, so the bytes only exist
	// once it is asked for them — unlike the text editors, where the view
	// holds the buffer and the save just posts it.
	const save = useCallback(async () => {
		const handle = viewerRef.current;
		if (!handle) return;

		const bytes = await handle.getContent();
		const saved = await panel.save(encodeBase64Asset(bytes));
		if (saved) {
			setIsDirty(false);
		}
	}, [panel.save]);

	const requestSave = useCallback(() => void save(), [save]);

	useFileViewControls(onControls, {
		// gated on the deck being dirty, not just writable: the bytes come
		// back re-serialised every time, so an idle save would rewrite the
		// file with a byte-different copy of what is already there
		canSave: !panel.readOnly && isDirty,
		isBusy: panel.isBusy,
		refresh: panel.read.refresh,
		save: requestSave,
	});

	if (panel.gate) return panel.gate;

	// checked before the shared read gate: a decode failure is not a read
	// failure, and both offer the download as the way out
	if (panel.read.status === "ERROR" || (panel.read.data && !content)) {
		return (
			<div className="flex size-full flex-col items-center justify-center gap-4 p-4">
				<Muted className="text-destructive" role="alert">
					{panel.read.error?.message ||
						"Failed to load the presentation"}
				</Muted>
				<Button
					type="button"
					onClick={() => void panel.download()}
					disabled={panel.isDownloading}
				>
					<DownloadIcon aria-hidden className="size-4" />
					{panel.isDownloading ? "Downloading" : "Download file"}
				</Button>
			</div>
		);
	}

	if (panel.readGate) return panel.readGate;
	if (!content) return null;

	return (
		<div className="relative size-full">
			<Suspense
				fallback={
					<output
						className="flex size-full items-center justify-center"
						aria-label="Loading presentation viewer"
					>
						<Spinner />
					</output>
				}
			>
				<FilePptxViewContent
					ref={viewerRef}
					content={content}
					fileName={config.name}
					canEdit={!panel.readOnly}
					onDirtyChange={setIsDirty}
				/>
			</Suspense>
		</div>
	);
};
