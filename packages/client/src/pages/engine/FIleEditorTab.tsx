import { ContentCopyOutlined, SaveOutlined } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { IconButton, Stack, useNotification } from "@semoss/ui";
import { FileEditor, type FileEditorRefDef } from "@/components/common";
import { Panel } from "@/components/workspace/panels";


interface FileEditorPanelProps {
	path: string;
	appId: string;
	insightId: string;
}

export const FileEditorTab = observer((props: FileEditorPanelProps) => {
	const { path, appId, insightId } = props;
	const notification = useNotification();

	const [isModified, setIsModified] = useState(false);
	const fileEditorRef = useRef<FileEditorRefDef>(null);

	const onFileEditorChange = (isModified: boolean) => {
		setIsModified(isModified);
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

	return (
		<Panel
			actions={
				<>
					<IconButton
						size={"small"}
						color={"default"}
						title={`Copy path - ${path}`}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							copyPath();
						}}
					>
						<ContentCopyOutlined fontSize="inherit" />
					</IconButton>
					<Stack flex={1}>&nbsp;</Stack>
					<IconButton
						size={"small"}
						color={"default"}
						title={"Save"}
						disabled={!isModified}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							fileEditorRef.current?.saveFile();
						}}
					>
						<SaveOutlined fontSize="inherit" />
					</IconButton>
				</>
			}
		>
			<FileEditor
				ref={fileEditorRef}
				type={"app"}
				space={appId}
				insightId={insightId}
				path={path}
				onChange={(_content, isModified) => {
					onFileEditorChange(isModified);
				}}
			/>
		</Panel>
	);
});