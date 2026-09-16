import { useEffect, useState } from "react";
import { CodeEditor, Markdown } from "@semoss/ui/next";
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

/** The view switch this editor offers. Module scope — the control reads it. */
const MARKDOWN_VIEW_MODES = [
	{ value: "raw", label: "Raw" },
	{ value: "preview", label: "Preview" },
];

/** Edit a Markdown file, with a rendered preview and a raw editor. */
const FileMarkdownEditorPanel = ({ id }: WorkbenchPanelProps) => {
	const { config, rename, setValue } = useWorkbenchPanel<
		FilePanelParams,
		FileEditorControlValue
	>(id);

	const panel = useFilePanel(config);
	const buffer = useFileBuffer({ panel, name: config.name, rename });
	const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

	useEffect(() => {
		setValue({
			canSave: !panel.readOnly,
			isBusy: panel.isBusy,
			refresh: panel.read.refresh,
			save: buffer.save,
			viewModes: MARKDOWN_VIEW_MODES,
			viewMode: viewMode,
			// the union is known here, not in the shared control
			setViewMode: (mode) => setViewMode(mode as "preview" | "raw"),
		});
	}, [
		panel.readOnly,
		panel.isBusy,
		panel.read.refresh,
		buffer.save,
		setValue,
		viewMode,
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
		<div className="relative size-full overflow-hidden bg-background">
			{viewMode === "raw" ? (
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
			) : (
				<div className="size-full overflow-y-auto px-6 py-4">
					<Markdown>{buffer.content}</Markdown>
				</div>
			)}
		</div>
	);
};

/** Scope-aware Markdown editor blueprint shared by all workbenches. */
export const FILE_MARKDOWN_EDITOR_PANEL: WorkbenchPanelConfig<
	FilePanelParams,
	FileEditorControlValue
> = {
	name: "Markdown",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: FilePanelIcon,
	content: FileMarkdownEditorPanel,
};
