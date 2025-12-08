import { ContentCopyOutlined, SaveOutlined } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { Chip, IconButton, Stack, styled, useNotification } from "@semoss/ui";
import { FileEditor, type FileEditorRefDef } from "@/components/common";
import { Panel } from "@/components/workspace/panels";

const StyledChip = styled(Chip)(({ theme }) => ({
	backgroundColor: theme.palette.primary.selected,
	color: theme.palette.info.dark,
	fontFamily: "Inter",
	fontSize: "13px",
	fontWeight: 400,
	height: "24px",
	marginLeft: theme.spacing(1),
}));


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

		const fileName = useMemo(() => {
		if (!path) return "";
		const parts = path.split(/[/\\]/);
		return parts[parts.length - 1];
	}, [path]);

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
					{fileName && <StyledChip label={fileName} size="small" />}
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
				type={"engine"}
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
