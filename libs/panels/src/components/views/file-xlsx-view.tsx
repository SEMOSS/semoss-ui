import {
	type EditorHandle,
	SpreadsheetEditor,
} from "@christophervr/xlsx-react-viewer";
import { DownloadIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	decodeBase64Asset,
	getFileOperationErrorMessage,
} from "@semoss/shared";
import { Button, Muted, toast } from "@semoss/ui/next";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";

const getFileCommand = (event: Event): string | null => {
	if (!(event instanceof CustomEvent) || typeof event.detail !== "object") {
		return null;
	}
	if (
		event.detail === null ||
		!("command" in event.detail) ||
		typeof event.detail.command !== "string"
	) {
		return null;
	}
	return event.detail.command;
};

/** Preview and edit an Excel workbook from a project, engine, or user resource. */
export const FileXlsxView = ({ config, onControls }: FileViewProps) => {
	const panel = useFilePanel(config, { base64: true });
	const [handle, setHandle] = useState<EditorHandle | null>(null);
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
		void handle.load(content, config.name).catch((error: unknown) => {
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

	const save = useCallback(async () => {
		if (!handle || serializingRef.current) return;
		serializingRef.current = true;
		setIsSerializing(true);
		try {
			if (
				await panel.save(encodeBytesToBase64(await handle.saveBytes()))
			) {
				handle.markClean();
				setIsDirty(false);
			}
		} catch (error) {
			const normalized =
				error instanceof Error ? error : new Error(String(error));
			toast.error(
				getFileOperationErrorMessage(
					"Failed to save Excel workbook",
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
	const handleFileCommand = useCallback(
		(event: Event) => {
			const command = getFileCommand(event);
			if (!command || command === "print") return;
			event.preventDefault();
			if (command === "save") requestSave();
		},
		[requestSave],
	);

	useEffect(() => {
		if (!handle) return;
		handle.element.addEventListener("file-command", handleFileCommand);
		return () =>
			handle.element.removeEventListener(
				"file-command",
				handleFileCommand,
			);
	}, [handle, handleFileCommand]);

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
						"Failed to load Excel workbook"}
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
			<SpreadsheetEditor
				ref={setHandle}
				className="size-full"
				fileName={config.name}
				readOnly={panel.readOnly}
				onDirtyChange={setIsDirty}
				onWorkbookError={setEditorError}
			/>
		</div>
	);
};
