import { useEffect, useState } from "react";
import { getFileIconComponent } from "@semoss/shared";
import { CodeEditor, Markdown } from "@semoss/ui/next";
import { useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "./file-editor.utility";
import {
	FileMarkdownEditorControl,
	type FileMarkdownEditorControlValue,
} from "./file-markdown-editor-control";
import { matchesFilePanel } from "./file-panel.mode";
import { useFileBuffer } from "./use-file-buffer";
import { type FilePanelParams, useFilePanel } from "./use-file-panel";

export type FileMarkdownEditorParams = FilePanelParams;

/** Edit a Markdown file, with a rendered preview and a raw editor. */
const FileMarkdownEditorPanel = ({
	config,
	id,
	rename,
	setValue,
}: WorkbenchPanelProps<
	FileMarkdownEditorParams,
	FileMarkdownEditorControlValue
>) => {
	const panel = useFilePanel(config);
	const buffer = useFileBuffer({ panel, name: config.name, rename });
	const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

	useEffect(() => {
		setValue({
			canSave: !panel.readOnly,
			isBusy: panel.isBusy,
			refresh: panel.read.refresh,
			save: buffer.save,
			setViewMode,
			viewMode,
		});
	}, [
		panel.readOnly,
		panel.isBusy,
		panel.read.refresh,
		buffer.save,
		setValue,
		viewMode,
	]);
	useWorkbenchControl(id, FileMarkdownEditorControl);

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
			{panel.overlay}
		</div>
	);
};

/** Scope-aware Markdown editor blueprint shared by all workbenches. */
export const FILE_MARKDOWN_EDITOR_PANEL: WorkbenchPanelConfig<
	FileMarkdownEditorParams,
	FileMarkdownEditorControlValue
> = {
	name: "Markdown",
	canRename: false,
	mount: "keepAlive",
	matches: matchesFilePanel,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FileMarkdownEditorPanel,
};
