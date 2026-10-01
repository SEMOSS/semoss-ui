import { CodeEditor } from "@semoss/ui/next";
import { useFileBuffer } from "../../hooks/use-file-buffer";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import type { FileViewProps } from "../../types/file-view.types";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../../utility/file-editor.utility";

/** Edit a file in a project, engine, or insight resource. */
export const FileCodeView = ({ config, rename, onControls }: FileViewProps) => {
	const panel = useFilePanel(config);
	const buffer = useFileBuffer({ panel, name: config.name, rename });

	useFileViewControls(onControls, {
		canSave: !panel.readOnly,
		isBusy: panel.isBusy,
		isDirty: buffer.isDirty,
		refresh: panel.read.refresh,
		save: buffer.save,
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
