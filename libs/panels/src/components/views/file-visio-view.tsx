import { DownloadIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	type ViewerCallbacks,
	type ViewerHandle,
	VisioViewer,
} from "visio-react-viewer";
import {
	decodeBase64Asset,
	getFileOperationErrorMessage,
} from "@semoss/shared";
import { Button, Muted, toast } from "@semoss/ui/next";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";

/** Preview and edit a Visio drawing from a project, engine, or user resource. */
export const FileVisioView = ({ config, onControls }: FileViewProps) => {
	const panel = useFilePanel(config, { base64: true });
	const [handle, setHandle] = useState<ViewerHandle | null>(null);
	const [editorError, setEditorError] = useState<Error | null>(null);
	const [isDirty, setIsDirty] = useState(false);
	const [isSerializing, setIsSerializing] = useState(false);
	const serializingRef = useRef(false);
	const content = useMemo(
		() => decodeBase64Asset(panel.read.data),
		[panel.read.data],
	);

	useEffect(() => {
		if (panel.read.status === "SUCCESS" && panel.read.revision > 0) {
			setEditorError(null);
			setIsDirty(false);
		}
	}, [panel.read.revision, panel.read.status]);

	useEffect(() => {
		if (!handle || !content) return;
		let isCurrent = true;
		const source = new File([Uint8Array.from(content)], config.name, {
			type: "application/vnd.ms-visio.drawing",
		});
		void handle.load(source).catch((error: unknown) => {
			if (isCurrent) {
				setEditorError(
					error instanceof Error ? error : new Error(String(error)),
				);
			}
		});
		return () => {
			isCurrent = false;
		};
	}, [config.name, content, handle]);

	useEffect(() => {
		if (!handle) return;
		handle.element.inert = panel.readOnly;
		handle.element.setAttribute("aria-readonly", String(panel.readOnly));
		return () => {
			handle.element.inert = false;
			handle.element.removeAttribute("aria-readonly");
		};
	}, [handle, panel.readOnly]);

	const save = useCallback(async () => {
		if (!handle || serializingRef.current) return;
		serializingRef.current = true;
		setIsSerializing(true);
		try {
			const result = handle.exportVsdx();
			if (result.diagnostics.length > 0) {
				throw new Error(
					result.diagnostics
						.map((diagnostic) => diagnostic.message)
						.join("; "),
				);
			}
			if (await panel.save(encodeBytesToBase64(result.bytes))) {
				setIsDirty(false);
			}
		} catch (error) {
			const normalized =
				error instanceof Error ? error : new Error(String(error));
			toast.error(
				getFileOperationErrorMessage(
					"Failed to save Visio diagram",
					normalized,
				),
			);
			console.error(normalized);
		} finally {
			serializingRef.current = false;
			setIsSerializing(false);
		}
	}, [handle, panel.save]);

	const requestSave = useCallback(() => void save(), [save]);
	const events = useMemo<ViewerCallbacks>(
		() => ({
			"document-change": (detail) => setIsDirty(detail.dirty),
			"document-error": setEditorError,
		}),
		[],
	);

	useFileViewControls(onControls, {
		canDownload: panel.access.status === "ready",
		download: panel.download,
		canSave:
			!panel.readOnly &&
			isDirty &&
			panel.read.status === "SUCCESS" &&
			handle !== null,
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
						"Failed to load Visio diagram"}
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
		<section
			className="relative size-full"
			aria-label={`${panel.readOnly ? "Read-only " : ""}Visio diagram: ${config.name}`}
		>
			<VisioViewer
				ref={setHandle}
				className="size-full"
				showToolbar={!panel.readOnly}
				events={events}
				aria-label={config.name}
			/>
		</section>
	);
};
