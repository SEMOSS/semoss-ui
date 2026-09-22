import { useCallback, useState } from "react";
import { CodeEditor, Markdown } from "@semoss/ui/next";
import { useFileBuffer } from "../../hooks/use-file-buffer";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../../utility/file-editor.utility";

/** The view switch this editor offers. Module scope — the chrome reads it. */
const MARKDOWN_VIEW_MODES = [
	{ value: "raw", label: "Raw" },
	{ value: "preview", label: "Preview" },
];

/** Edit a Markdown file, with a rendered preview and a raw editor. */
export const FileMarkdownView = ({
	config,
	rename,
	onControls,
}: FileViewProps) => {
	const panel = useFilePanel(config);
	const buffer = useFileBuffer({ panel, name: config.name, rename });
	const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

	// the union is known here, not in the shared chrome
	const selectViewMode = useCallback(
		(mode: string) => setViewMode(mode as "preview" | "raw"),
		[],
	);

	useFileViewControls(onControls, {
		canSave: !panel.readOnly,
		isBusy: panel.isBusy,
		isDirty: buffer.isDirty,
		refresh: panel.read.refresh,
		save: buffer.save,
		viewModes: MARKDOWN_VIEW_MODES,
		viewMode: viewMode,
		setViewMode: selectViewMode,
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
