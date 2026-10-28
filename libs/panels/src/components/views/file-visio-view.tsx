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
import { toast } from "@semoss/ui/next";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import { useOfficeFileCommands } from "../../hooks/use-office-file-commands";
import type { FileViewProps } from "../../types/file-view.types";
import { OfficeViewerError } from "./office/office-viewer-error";
import { OfficeViewerFrame } from "./office/office-viewer-frame";
import {
	getVisioSaveSnapshot,
	isVisioSaveSnapshotCurrent,
	VISIO_VIEWER_POLICY,
} from "./office/visio-viewer-policy";

/** Preview and edit a Visio drawing from a project, engine, or user resource. */
export const FileVisioView = ({ config, onControls }: FileViewProps) => {
	const panel = useFilePanel(config, { base64: true });
	const [handle, setHandle] = useState<ViewerHandle | null>(null);
	const handleRef = useRef<ViewerHandle | null>(null);
	const [editorError, setEditorError] = useState<Error | null>(null);
	const [isDirty, setIsDirty] = useState(false);
	const [isSerializing, setIsSerializing] = useState(false);
	const serializingRef = useRef(false);
	const sourceRevisionRef = useRef(panel.read.revision);
	sourceRevisionRef.current = panel.read.revision;
	const content = useMemo(
		() => decodeBase64Asset(panel.read.data),
		[panel.read.data],
	);
	const handleViewerRef = useCallback((next: ViewerHandle | null) => {
		handleRef.current = next;
		setHandle(next);
	}, []);

	useEffect(() => {
		if (panel.read.status === "SUCCESS" && panel.read.revision > 0) {
			setEditorError(null);
			setIsDirty(false);
		}
	}, [panel.read.revision, panel.read.status]);

	useEffect(() => {
		if (!handle || !content) return;
		let isCurrent = true;
		// The vendor's fileName is read-only. Keep the live name in host chrome
		// rather than reload the drawing and discard edits after a rename.
		void handle.load(Uint8Array.from(content)).catch((error: unknown) => {
			if (isCurrent) {
				setEditorError(
					error instanceof Error ? error : new Error(String(error)),
				);
			}
		});
		return () => {
			isCurrent = false;
		};
	}, [content, handle]);

	useEffect(() => {
		if (!handle) return;
		handle.element.statusBar = "neutral";
	}, [handle]);

	const save = useCallback(async () => {
		if (!handle || panel.readOnly || serializingRef.current) return;
		serializingRef.current = true;
		setIsSerializing(true);
		try {
			const snapshot = getVisioSaveSnapshot(handle.controller);
			const sourceRevision = sourceRevisionRef.current;
			const result = handle.exportVsdx();
			// Diagnostics describe compatibility limits of accepted edits. The
			// viewer rejects unsupported edits and throws on export failures.
			if (
				(await panel.save(encodeBytesToBase64(result.bytes))) &&
				handleRef.current === handle &&
				sourceRevisionRef.current === sourceRevision &&
				isVisioSaveSnapshotCurrent(handle.controller, snapshot)
			) {
				handle.controller.markClean();
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
	}, [handle, panel.readOnly, panel.save]);

	const requestSave = useCallback(() => void save(), [save]);
	useOfficeFileCommands(handle?.element ?? null, requestSave);
	const events = useMemo<ViewerCallbacks>(
		() => ({
			"document-change": (detail) => setIsDirty(detail.dirty),
			"document-error": (error) => {
				// The owned load promise reports fatal load failures. Subsequent
				// operation errors must leave the existing drawing and history intact.
				if (!handleRef.current?.controller.state.document) return;
				toast.error(
					getFileOperationErrorMessage(
						"Could not update Visio diagram",
						error,
					),
				);
				console.error(error);
			},
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
			<OfficeViewerError
				message={
					panel.read.error?.message ||
					editorError?.message ||
					"Failed to load Visio diagram"
				}
				isDownloading={panel.isDownloading}
				onDownload={() => void panel.download()}
			/>
		);
	}
	if (panel.readGate) return panel.readGate;
	if (!content) return null;

	return (
		<OfficeViewerFrame
			label={`${panel.readOnly ? "Read-only " : ""}Visio diagram: ${config.name}`}
		>
			<VisioViewer
				key={panel.read.revision}
				{...VISIO_VIEWER_POLICY}
				ref={handleViewerRef}
				className="size-full"
				canEdit={!panel.readOnly}
				events={events}
				aria-label={config.name}
			/>
		</OfficeViewerFrame>
	);
};
