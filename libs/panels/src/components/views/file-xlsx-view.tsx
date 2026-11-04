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
import { useXlsxFileAccess } from "../../hooks/use-xlsx-file-access";
import { getFilePanelScope } from "../../types/file-panel.types";
import type { FileViewProps } from "../../types/file-view.types";
import { OfficeViewerError } from "./office/office-viewer-error";
import { OfficeViewerFrame } from "./office/office-viewer-frame";
import { XlsxFileAccessNotice } from "./office/xlsx-file-access-notice";
import { XLSX_HIDDEN_ACTIONS } from "./office/xlsx-viewer-policy";

/** Preview and edit an Excel workbook from a project, engine, or user resource. */
export const FileXlsxView = ({ config, onControls }: FileViewProps) => {
	const panel = useFilePanel(config, { base64: true });
	const [handle, setHandle] = useState<EditorHandle | null>(null);
	const element = handle?.element ?? null;
	const resourceScope = getFilePanelScope(config.mode);
	const fileAccess = useXlsxFileAccess({
		element,
		sourceKey: `${resourceScope}:${panel.read.revision}`,
		readOnly: panel.readOnly,
	});
	const readOnly = fileAccess.readOnly;
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
		resourceScope,
		readOnly,
		changeEvent: "workbook-change",
		onSave: panel.save,
		saveErrorMessage: "Failed to save Excel workbook",
	});

	useEffect(() => {
		if (!element) return;
		const enforcePolicy = () => {
			element.hiddenActions = XLSX_HIDDEN_ACTIONS;
		};
		enforcePolicy();
		element.addEventListener("ribbon-customize", enforcePolicy);
		return () => {
			element.removeEventListener("ribbon-customize", enforcePolicy);
		};
	}, [element]);

	useOfficeFileCommands(element, editor.save);
	useFileViewControls(onControls, {
		canDownload: panel.access.status === "ready",
		download: panel.download,
		canSave:
			!readOnly &&
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
		editor.error ||
		fileAccess.error
	) {
		return (
			<OfficeViewerError
				message={
					panel.read.error?.message ||
					fileAccess.error ||
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
			className="semoss-xlsx-viewer flex flex-col"
		>
			{!panel.readOnly &&
				fileAccess.access &&
				fileAccess.access.kind !== "editable" && (
					<XlsxFileAccessNotice
						access={fileAccess.access}
						onEnableEditing={fileAccess.enableEditing}
						onUnlock={fileAccess.unlock}
					/>
				)}
			<SpreadsheetEditor
				ref={setHandle}
				className="min-h-0 w-full flex-1"
				fileName={config.name}
				readOnly={readOnly}
				showToolbar
				showFormulaBar
				hiddenActions={XLSX_HIDDEN_ACTIONS}
			/>
		</OfficeViewerFrame>
	);
};
