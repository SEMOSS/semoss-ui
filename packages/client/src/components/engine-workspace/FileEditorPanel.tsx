import { Copy, Save } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { useNotification } from "@semoss/ui";
import { FileEditor, type FileEditorRefDef } from "@/components/common";
import { Panel } from "./Panel";

interface FileEditorPanelProps {
	path: string;
	engineId: string;
	insightId: string;
	onUnsave?: (path: string) => void;
	onSave?: (path: string) => void;
}

export const FileEditorPanel = observer((props: FileEditorPanelProps) => {
	const { path, engineId, insightId, onUnsave, onSave } = props;
	const notification = useNotification();

	const [isModified, setIsModified] = useState(false);
	const fileEditorRef = useRef<FileEditorRefDef>(null);

	const onFileEditorChange = (isModifiedFlag: boolean) => {
		setIsModified(isModifiedFlag);
		if (isModifiedFlag) {
			onUnsave?.(path);
		} else {
			onSave?.(path);
		}
	};

	const copyPath = async () => {
		try {
			await navigator.clipboard.writeText(path);
			notification.add({
				color: "success",
				message: "Successfully copied path",
			});
		} catch {
			notification.add({
				color: "error",
				message: "Unable to copy path",
			});
		}
	};

	const handleSaveClick = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!fileEditorRef.current?.saveFile) return;

		try {
			const result = fileEditorRef.current.saveFile();
			if (result instanceof Promise) {
				await result;
			}

			setIsModified(false);
			onSave?.(path);
		} catch {
			notification.add({
				color: "error",
				message: "Failed to save file",
			});
		}
	};

	return (
		<Panel
			actions={
				<>
					<button
						type="button"
						className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
						title={`Copy path - ${path}`}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							copyPath();
						}}
					>
						<Copy className="h-4 w-4" />
					</button>
					<div className="flex-1">&nbsp;</div>
					<button
						type="button"
						className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
						title="Save"
						disabled={!isModified}
						onClick={handleSaveClick}
					>
						<Save className="h-4 w-4" />
					</button>
				</>
			}
		>
			<FileEditor
				ref={fileEditorRef}
				type={"engine"}
				space={engineId}
				insightId={insightId}
				path={path}
				onChange={(_content, isModifiedFlag) => {
					onFileEditorChange(isModifiedFlag);
				}}
			/>
		</Panel>
	);
});
