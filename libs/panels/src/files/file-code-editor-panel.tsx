import { useEffect } from "react";
import { getFileIconComponent } from "@semoss/shared";
import { CodeEditor } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchControl } from "@semoss/workbench";
import {
	FileCodeEditorControl,
	type FileCodeEditorControlValue,
} from "./file-code-editor-control";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "./file-editor.utility";
import { matchesFilePanel } from "./file-panel.mode";
import { useFileBuffer } from "./use-file-buffer";
import { type FilePanelParams, useFilePanel } from "./use-file-panel";

export type FileCodeEditorParams = FilePanelParams;

/** Edit a file in a project, engine, or insight resource. */
const FileCodeEditorPanel = ({
	config,
	id,
	rename,
	setValue,
}: WorkbenchPanelProps<FileCodeEditorParams, FileCodeEditorControlValue>) => {
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
	useWorkbenchControl(id, FileCodeEditorControl);

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
			{panel.overlay}
		</div>
	);
};

/** Scope-aware code editor blueprint shared by all workbenches. */
export const FILE_CODE_EDITOR_PANEL: WorkbenchPanelConfig<
	FileCodeEditorParams,
	FileCodeEditorControlValue
> = {
	name: "Editor",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FileCodeEditorPanel,
};
