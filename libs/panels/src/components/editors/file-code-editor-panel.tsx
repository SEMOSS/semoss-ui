import { useEffect } from "react";
import { CodeEditor } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import { useFileBuffer } from "../../hooks/use-file-buffer";
import { type FilePanelParams, useFilePanel } from "../../hooks/use-file-panel";
import { useFilesChanged } from "../../hooks/use-files-changed";
import { matchesFilePanel } from "../../types/file-panel.types";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../../utility/file-editor.utility";
import {
	FileEditorControl,
	type FileEditorControlValue,
} from "../file-panel-control";
import { FilePanelIcon } from "../file-panel-icon";

/** Edit a file in a project, engine, or insight resource. */
const FileCodeEditorPanel = ({ id }: WorkbenchPanelProps) => {
	const { config, rename, setValue } = useWorkbenchPanel<
		FilePanelParams,
		FileEditorControlValue
	>(id);

	const panel = useFilePanel(config);
	const buffer = useFileBuffer({
		panel,
		name: config.name,
		rename,
	});

	useEffect(() => {
		setValue({
			canSave: !panel.readOnly,
			isBusy: panel.isBusy,
			refresh: panel.read.refresh,
			save: buffer.save,
		});
	}, [
		panel.readOnly,
		panel.isBusy,
		panel.read.refresh,
		buffer.save,
		setValue,
	]);
	useWorkbenchControl(id, FileEditorControl);
	// Someone else changed this file — an agent, a branch switch, a commit
	// restore. Held back while the buffer is dirty: re-reading re-seeds it
	// from the server, which would throw the user's unsaved edits away.
	useFilesChanged({
		mode: config.mode,
		path: config.path,
		skip: buffer.isDirty,
		refresh: panel.read.refresh,
	});

	if (panel.gate) return panel.gate;
	if (panel.readGate) return panel.readGate;

	return (
		<div className="relative size-full">
			<CodeEditor
				className="size-full"
				code={buffer.content}
				disabled={panel.readOnly}
				language={getCodeEditorLanguage(config.path)}
				menuItems={getFileCodeEditorMenuItems({
					canSave: !panel.readOnly,
					isBusy: panel.isBusy,
					onDownload: () => void panel.download(),
					onRefresh: panel.read.refresh,
					onSave: buffer.save,
				})}
				onChange={(value) => buffer.setContent(value ?? "")}
			/>
		</div>
	);
};

/** Scope-aware code editor blueprint shared by all workbenches. */
export const FILE_CODE_EDITOR_PANEL: WorkbenchPanelConfig<
	FilePanelParams,
	FileEditorControlValue
> = {
	name: "Editor",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: FilePanelIcon,
	content: FileCodeEditorPanel,
};
