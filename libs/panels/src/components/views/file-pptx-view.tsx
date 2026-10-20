import { DownloadIcon } from "lucide-react";
import {
	PowerPointViewer,
	type PowerPointViewerHandle,
} from "pptx-react-viewer";
import { translationsEn } from "pptx-react-viewer/i18n";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getI18n, useTranslation } from "@semoss/i18n";
import {
	decodeBase64Asset,
	getFileOperationErrorMessage,
} from "@semoss/shared";
import { Button, Muted, toast } from "@semoss/ui/next";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";
import "pptx-react-viewer/styles";

let registered = false;
const registerViewerCopy = (i18n: ReturnType<typeof getI18n>) => {
	if (registered || !i18n) return;
	const ns = Array.isArray(i18n.options.defaultNS)
		? i18n.options.defaultNS[0]
		: (i18n.options.defaultNS ?? "translation");
	i18n.addResourceBundle("en", ns, translationsEn, true, false);
	registered = true;
};

registerViewerCopy(getI18n());

/** Preview and edit a PowerPoint file from a project, engine, or user resource. */
export const FilePptxView = ({ config, onControls }: FileViewProps) => {
	const { i18n } = useTranslation();
	const panel = useFilePanel(config, { base64: true });
	const viewerRef = useRef<PowerPointViewerHandle>(null);
	const serializingRef = useRef(false);
	const [editorError, setEditorError] = useState<Error | null>(null);
	const [isDirty, setIsDirty] = useState(false);
	const [isSerializing, setIsSerializing] = useState(false);
	const content = useMemo(
		() => decodeBase64Asset(panel.read.data),
		[panel.read.data],
	);

	useEffect(() => registerViewerCopy(i18n), [i18n]);
	useEffect(() => {
		if (panel.read.status === "SUCCESS" && panel.read.revision > 0) {
			setEditorError(null);
			setIsDirty(false);
		}
	}, [panel.read.revision, panel.read.status]);

	const save = useCallback(async () => {
		const handle = viewerRef.current;
		if (!handle || serializingRef.current) return;
		serializingRef.current = true;
		setIsSerializing(true);
		try {
			if (
				await panel.save(encodeBytesToBase64(await handle.getContent()))
			) {
				setIsDirty(false);
			}
		} catch (error) {
			const normalized =
				error instanceof Error ? error : new Error(String(error));
			toast.error(
				getFileOperationErrorMessage(
					"Failed to save presentation",
					normalized,
				),
			);
			console.error(normalized);
		} finally {
			serializingRef.current = false;
			setIsSerializing(false);
		}
	}, [panel.save]);

	const requestSave = useCallback(() => void save(), [save]);
	useFileViewControls(onControls, {
		canDownload: panel.access.status === "ready",
		download: panel.download,
		canSave:
			!panel.readOnly &&
			isDirty &&
			panel.read.status === "SUCCESS" &&
			viewerRef.current !== null,
		isDirty,
		isBusy:
			panel.isBusy || panel.access.status === "loading" || isSerializing,
		canRefresh: panel.access.status === "ready",
		refresh: panel.read.refresh,
		save: requestSave,
	});

	if (panel.gate) return panel.gate;
	if (
		panel.read.status === "ERROR" ||
		(panel.read.data && !content) ||
		editorError
	) {
		return (
			<div className="flex size-full flex-col items-center justify-center gap-4 p-4">
				<Muted className="text-destructive" role="alert">
					{panel.read.error?.message ||
						editorError?.message ||
						"Failed to load presentation"}
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
		<div className="pptx-viewer-scope relative size-full">
			<PowerPointViewer
				ref={viewerRef}
				content={content}
				fileName={config.name}
				defaultThemeKey="light"
				canEdit={!panel.readOnly}
				autosave={false}
				onDirtyChange={setIsDirty}
				onError={(message) => setEditorError(new Error(message))}
			/>
		</div>
	);
};
