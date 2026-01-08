import { useState } from "react";
import {
	Alert,
	Button,
	Checkbox,
	FileDropzone,
	LinearProgress,
	Modal,
	Stack,
	Typography,
} from "@semoss/ui";
import { uploadFile as uploadFileAPI } from "@/api";
import { useRootStore } from "@/hooks";

interface AddFileOverlayProps {
	/** Type of file opened */
	type: "app" | "insight" | "engine";

	/** Space where the file is located */
	space: string;

	/** Path where the file is being uploaded */
	uploadPath: string;

	/** Callback that is triggered onClose */
	onClose: (success: boolean, uploadPath: string) => void;
}

export const AddFileOverlay = (props: AddFileOverlayProps) => {
	const { type, space, uploadPath, onClose = () => null } = props;

	const { monolithStore, configStore } = useRootStore();

	const [isLoading, setIsLoading] = useState(false);
	const [uploadFile, setUploadFiles] = useState<File>(null);
	const [unzipFile, setUnzipFile] = useState<boolean>(false);
	const [fileError, setFileError] = useState<string>("");

	/**
	 * Validate if the file is a valid JSON
	 */
	const validateJSON = async (file: File): Promise<boolean> => {
		try {
			// Read the file content
			const fileContent = await file.text();

			// Try to parse the JSON
			JSON.parse(fileContent);

			return true; // Valid JSON
		} catch {
			return false; // Invalid JSON
		}
	};

	/**
	 * Handle file selection with validation
	 */
	const handleFileChange = async (newValue: File) => {
		setFileError("");

		if (!newValue) {
			setUploadFiles(null);
			return;
		}
		if (newValue.name.toLowerCase().endsWith(".json")) {
			// Validate JSON files
			const isValid = await validateJSON(newValue);

			if (!isValid) {
				setFileError(
					"This is not a valid JSON file. Please upload a valid JSON file.",
				);
				setUploadFiles(null);
				return;
			}
		}

		setUploadFiles(newValue);
	};

	/**
	 * Add the file to the app
	 */
	const addFile = async () => {
		try {
			setIsLoading(true);
			setFileError("");

			let upload = null;
			if (type === "app") {
				upload = await uploadFileAPI(
					[uploadFile],
					configStore.store.insightID,
					space,
					uploadPath,
				);
			} else if (type === "engine") {
				upload = await uploadFileAPI(
					[uploadFile],
					configStore.store.insightID,
					space,
					uploadPath,
					"engine",
				);
			} else {
				throw new Error("TODO");
			}

			if (!upload) {
				throw new Error("Error missing uploading app");
			}

			const path = `${uploadPath}${upload[0].fileName}`;
			if (unzipFile) {
				if (type === "app") {
					await monolithStore.runQuery(
						`UnzipFile(filePath=["${path}"], space=["${space}"])`,
					);
				}
				else if ( type === "engine") {
					await monolithStore.runQuery(
						`UnzipFile(filePath=["/${path.split("app_root/")[1]}"], space=["${space}"])`,
					);
				} 
				else {
					throw new Error("TODO");
				}
			}

			onClose(true, path);
		} catch (e) {
			console.error(e);
			setFileError("Error uploading file. Please try again.");
		} finally {
			setIsLoading(false);

			// reset state
			setUploadFiles(null);
			setUnzipFile(false);
		}
	};

	return (
		<>
			<Modal.Title>Upload Files</Modal.Title>
			<Modal.Content>
				<Stack direction={"column"} spacing={2}>
					<Typography variant="body2">
						Upload files to <b>{uploadPath}</b>
					</Typography>

					{fileError && <Alert severity="error">{fileError}</Alert>}

					<FileDropzone
						multiple={false}
						value={uploadFile}
						disabled={isLoading}
						onChange={handleFileChange}
					/>
						<Checkbox
							checked={unzipFile}
							onChange={() => {
								setUnzipFile(!unzipFile);
							}}
							label={
								<Typography variant="body2">Unzip?</Typography>
							}
						/>
				</Stack>
			</Modal.Content>
			<Modal.Actions>
				<Button
					type="button"
					disabled={isLoading}
					onClick={() => onClose(false, "")}
				>
					Cancel
				</Button>
				<Button
					variant={"contained"}
					disabled={isLoading || !uploadFile}
					onClick={() => addFile()}
				>
					Upload
				</Button>
			</Modal.Actions>
			{isLoading && <LinearProgress />}
		</>
	);
};
