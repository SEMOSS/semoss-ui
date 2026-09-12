import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
	useFileBuffer,
	useFilePanel,
} from "@semoss/panels";
import { FlexLayout } from "@semoss/shared";
import { CodeEditor } from "@semoss/ui/next";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";

interface AppFileEditorProps {
	/** Node */
	node: FlexLayout.TabNode;

	/** App */
	app: string;

	/** Render the file in read-only, view-only mode */
	readOnly?: boolean;
}

export const AppFileEditor: React.FC<AppFileEditorProps> = observer(
	({ node, app, readOnly = false }) => {
		const config: {
			name: string;
			path: string;
		} = node.getConfig();
		const panel = useFilePanel({
			mode: {
				type: "APP",
				app,
			},
			name: config.name,
			path: config.path,
		});
		const renameTab = useCallback(
			(name: string) => {
				node.getModel().doAction(
					FlexLayout.Actions.renameTab(node.getId(), name),
				);
			},
			[node],
		);
		const buffer = useFileBuffer({
			panel,
			name: config.name,
			rename: renameTab,
		});

		const isDriverFile = MCP.DRIVER_PATHS.some((f) =>
			config.path.endsWith(f),
		);
		const editorReadOnly = readOnly || panel.readOnly;

		if (panel.gate) return panel.gate;
		if (panel.readGate) return panel.readGate;

		return (
			<div className="relative size-full">
				<CodeEditor
					className="size-full"
					code={buffer.content}
					disabled={editorReadOnly}
					language={getCodeEditorLanguage(config.path)}
					menuItems={getFileCodeEditorMenuItems({
						canSave: !editorReadOnly,
						isBusy: panel.isBusy,
						onDownload: () => void panel.download(),
						onRefresh: panel.read.refresh,
						onSave: buffer.save,
					})}
					onChange={(value) => buffer.setContent(value ?? "")}
				/>
				{isDriverFile ? (
					<div className="absolute top-2 right-2">
						<MetadataHelpDialog compact />
					</div>
				) : null}
				{panel.overlay}
			</div>
		);
	},
);
