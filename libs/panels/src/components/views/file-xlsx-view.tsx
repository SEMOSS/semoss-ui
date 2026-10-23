import {
	type EditorHandle,
	SpreadsheetEditor,
} from "@christophervr/xlsx-react-viewer";
import { useEffect, useMemo, useState } from "react";
import { decodeBase64Asset } from "@semoss/shared";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import { useOfficeEditorSession } from "../../hooks/use-office-editor-session";
import { useOfficeFileCommands } from "../../hooks/use-office-file-commands";
import { getFilePanelScope } from "../../types/file-panel.types";
import type { FileViewProps } from "../../types/file-view.types";
import { OfficeViewerError } from "./office/office-viewer-error";
import { OfficeViewerFrame } from "./office/office-viewer-frame";
import { XLSX_HIDDEN_ACTIONS } from "./office/xlsx-viewer-policy";

/** Preview and edit an Excel workbook from a project, engine, or user resource. */
export const FileXlsxView = ({ config, onControls }: FileViewProps) => {
	const panel = useFilePanel(config, { base64: true });
	const [handle, setHandle] = useState<EditorHandle | null>(null);
	const element = handle?.element ?? null;
	const content = useMemo(
		() => decodeBase64Asset(panel.read.data),
		[panel.read.data],
	);
	const editor = useOfficeEditorSession({
		element,
		content,
		fileName: config.name,
		readRevision: panel.read.revision,
		readStatus: panel.read.status,
		resourceScope: getFilePanelScope(config.mode),
		readOnly: panel.readOnly,
		changeEvent: "workbook-change",
		onSave: panel.save,
		saveErrorMessage: "Failed to save Excel workbook",
	});

	useEffect(() => {
		if (!element) return;
		const enforcePermission = () => {
			if (panel.readOnly) element.readOnly = true;
		};
		const enforcePolicy = () => {
			element.hiddenActions = XLSX_HIDDEN_ACTIONS;
		};
		element.readOnly = panel.readOnly;
		enforcePolicy();
		element.addEventListener("readonly-change", enforcePermission);
		element.addEventListener("ribbon-customize", enforcePolicy);
		return () => {
			element.removeEventListener("readonly-change", enforcePermission);
			element.removeEventListener("ribbon-customize", enforcePolicy);
		};
	}, [element, panel.readOnly]);

	useOfficeFileCommands(element, editor.save);
	useFileViewControls(onControls, {
		canDownload: panel.access.status === "ready",
		download: panel.download,
		canSave:
			!panel.readOnly &&
			editor.isDirty &&
			!editor.isLoading &&
			!editor.error &&
			panel.read.status === "SUCCESS" &&
			element !== null,
		isDirty: editor.isDirty,
		isBusy:
			panel.isBusy ||
			panel.access.status === "loading" ||
			editor.isLoading ||
			editor.isSaving,
		canRefresh: panel.access.status === "ready",
		refresh: panel.read.refresh,
		save: editor.save,
	});

	if (panel.gate) return panel.gate;
	if (
		panel.read.status === "ERROR" ||
		(panel.read.data && !content) ||
		editor.error
	) {
		return (
			<OfficeViewerError
				message={
					panel.read.error?.message ||
					editor.error?.message ||
					"Failed to load Excel workbook"
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
			label={`Excel workbook: ${config.name}`}
			className="semoss-xlsx-viewer"
		>
			<SpreadsheetEditor
				ref={setHandle}
				className="size-full"
				fileName={config.name}
				readOnly={panel.readOnly}
				showToolbar
				showFormulaBar
				hiddenActions={XLSX_HIDDEN_ACTIONS}
			/>
		</OfficeViewerFrame>
	);
};
