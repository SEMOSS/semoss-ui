import { ContentCopyOutlined, SaveOutlined } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	IconButton,
	Modal,
	Stack,
	TextField,
	useNotification,
} from "@semoss/ui";
import { FileEditor, type FileEditorRefDef } from "@/components/common";
import { useWorkspace } from "@/hooks";
import type { FileSavedEventDetail } from "@/types/types";
import { Panel } from "./Panel";

interface FileEditorPanelProps {
	/** Path to the file location */
	path: string;
}

export const FileEditorPanel = observer((props: FileEditorPanelProps) => {
	const { path } = props;
	const { workspace } = useWorkspace();
	const notification = useNotification();

	const [isModified, setIsModified] = useState(false);

	const fileEditorRef = useRef<FileEditorRefDef>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [commitMsg, setCommitMsg] = useState("");
	// Use global workspace toggle
	const toggleChecked = workspace.requireCommitMessage;

	// get the name
	const name = path.split("/").pop();

	/**
	 * Triggered when a file is changed
	 * @param isModified - isModified
	 */
	const onFileEditorChange = (isModified: boolean) => {
		try {
			// update
			setIsModified(isModified);

			// update the tabs
			updatePanels(isModified);
		} catch (e) {
			notification.add({
				color: "error",
				message: e,
			});
		}
	};

	/**
	 * Triggered when a file is changed
	 * @param isModified - isModified
	 */
	const updatePanels = (isModified: boolean) => {
		try {
			// get the model
			const model = workspace.model;
			if (!model) {
				throw new Error("Missing model");
			}

			// visit the notes, and see if it exists
			model.visitNodes((node) => {
				// check if it is a tabNode
				if (node instanceof FlexLayout.TabNode) {
					// it needs to be a file-editor
					const component = node.getComponent();
					if (component !== "file-editor") {
						return;
					}

					// path and space need to match
					const config = node.getConfig();
					if (path !== config.path) {
						return;
					}

					const id = node.getId();
					if (isModified) {
						model.doAction(
							FlexLayout.Actions.renameTab(id, `${name}*`),
						);
					} else {
						model.doAction(
							FlexLayout.Actions.renameTab(id, `${name}`),
						);
					}
				}
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: e,
			});
		}
	};

	/**
	 * Copy the path to the clipboard
	 */
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
	// Generic save helper (with or without commit message)
	const performSave = async (message: string) => {
		try {
			await fileEditorRef.current?.saveFile(message);
			const successMsg = message.trim()
				? `Save successful! File is saved with the following commit message: ${message}`
				: "Save successful!";
			notification.add({
				color: "success",
				message: successMsg,
			});
			setCommitMsg("");
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message || "Error saving file",
			});
		}
	};

	// Save handler for modal
	const handleModalSave = async () => {
		setModalOpen(false);
		await performSave(commitMsg);
	};

	//  Handle file saved callback - trigger versions table refresh

	const handleFileSaved = () => {
		// Dispatch a custom event to notify other components that a file was saved
		const event: CustomEvent<FileSavedEventDetail> = new CustomEvent(
			"fileSaved",
			{
				detail: {
					appId: workspace.appId,
					path: path,
					type: "file",
				},
			},
		);
		window.dispatchEvent(event);
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
							if (toggleChecked) {
								setModalOpen(true);
							} else {
								performSave("");
							}
						}}
					>
						<SaveOutlined fontSize="inherit" />
					</IconButton>

					<Modal
						open={modalOpen}
						onClose={() => setModalOpen(false)}
						aria-labelledby="commit-modal-title"
						aria-describedby="commit-modal-description"
						fullWidth
					>
						<Modal.Title>Enter Commit Message</Modal.Title>
						<Modal.Content>
							<Stack spacing={2}>
								<TextField
									autoFocus
									fullWidth
									multiline
									minRows={1}
									maxRows={5}
									label="Commit Message"
									value={commitMsg}
									onChange={(e) =>
										setCommitMsg(e.target.value)
									}
								/>
							</Stack>
						</Modal.Content>
						<Modal.Actions>
							<Stack
								flex={1}
								direction="row"
								justifyContent="end"
								alignItems="center"
								spacing={1}
								padding={2}
							>
								<Button
									variant="contained"
									color="primary"
									disabled={
										toggleChecked && !commitMsg.trim()
									}
									onClick={handleModalSave}
								>
									Save
								</Button>
							</Stack>
						</Modal.Actions>
					</Modal>
				</>
			}
		>
			<FileEditor
				ref={fileEditorRef}
				type={"app"}
				space={workspace.appId}
				insightId={workspace.insightId}
				path={path}
				agentModelEngine={workspace.agentModelEngine}
				onFileSaved={handleFileSaved}
				onChange={(_content, isModified) => {
					onFileEditorChange(isModified);
				}}
			/>
		</Panel>
	);
});
