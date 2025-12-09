import { useState } from "react";
import {
	Button,
	LinearProgress,
	Modal,
	Stack,
	TextField,
	Typography,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";

interface CreateFileOverlayProps {
	/** Type of file opened */
	type: "app" | "insight" | "engine";

	/** Space where the file will be create */
	space: string;

	/** Mode of the modal */
	mode: "directory" | "file";

	/** Path where the file is being uploaded */
	uploadPath: string;

	/** Callback that is triggered onClose */
	onClose: (success: boolean, uploadPath: string) => void;
}

export const CreateFileOverlay = (props: CreateFileOverlayProps) => {
	const { type, space, mode, uploadPath, onClose = () => null } = props;

	const { monolithStore } = useRootStore();

	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState<string>("");
	/**
	 * Adds .txt extension if no extension is provided for files
	 */
	const getFileNameWithExtension = (fileName: string): string => {
		if (mode === "directory") {
			return fileName;
		}
		const hasExtension = /\.[a-zA-Z0-9]+$/.test(fileName);

		if (!hasExtension) {
			return `${fileName}.txt`;
		}

		return fileName;
	};

	/**
	 * Create the file
	 */
	const createFile = async () => {
		try {
			setIsLoading(true);

			if (!name) {
				throw new Error("Name is required");
			}

			const finalName = getFileNameWithExtension(name);
			let pixel = "";
			let path = "";
			if (type === "app") {
				path = uploadPath;

				// add a slash if there is none
				if (path.slice(-1) !== "/") {
					path = `${path}/`;
				}

				// append the name
				path = `${path}${finalName}`;

				if (mode === "file") {
					pixel = `SaveAsset(fileName=["${path}"], content=["<encode></encode>"], space=["${space}"]);CommitAsset(filePath=["${path}"], comment=["Creating file"], space=["${space}"]);`;
				} else if (mode === "directory") {
					// add in the / to make it a directory
					if (path.slice(-1) !== "/") {
						path = `${path}/`;
					}

					pixel = `MakeDirectory(filePath=["${path}"], space=["${space}"]);`;
				}
			} else if (type === "engine") {
				path = uploadPath;

				// add a slash if there is none
				if (path.slice(-1) !== "/") {
					path = `${path}/`;
				}

				// append the name
				path = `${path}${finalName}`;
				if (mode === "file") {
					pixel = `SaveEngineAssets(filePath=["/${path.split("assets/")[1]}"], content=["<encode></encode>"], engine=["${space}"]);CommitAsset(filePath=["/${path.split("assets/")[1]}"], comment=["Creating file"], engine=["${space}"]);`;
				} else if (mode === "directory") {
					// add in the / to make it a directory
					if (path.slice(-1) !== "/") {
						path = `${path}/`;
					}

					pixel = `NewEngineAssetsDirectory(filePath=["${path.split("assets/")[1]}"], engine=["${space}"]);`;
				}
			} else {
				throw new Error("TODO");
			}

			if (!pixel) {
				throw new Error("No Pixel defined");
			}

			const { errors } = await monolithStore.runQuery(pixel);
			if (errors.length > 0) {
				for (const e of errors) {
					throw new Error(e);
				}
			}

			onClose(true, path);
		} catch (e) {
			console.error(e);
		} finally {
			setIsLoading(false);

			// reset state
			setName("");
		}
	};

	/**
	 * Handle Enter key press
	 */
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && name && !isLoading) {
			e.preventDefault();
			createFile();
		}
	};

	return (
		<>
			<Modal.Title>
				Create {mode === "file" ? "File" : "Folder"}
			</Modal.Title>
			<Modal.Content>
				<Stack direction={"column"} spacing={2}>
					<Typography variant="body2">
						Creating {mode === "file" ? "File" : "Folder"} at{" "}
						<b>{uploadPath}</b>
					</Typography>
					<TextField
						label="Name"
						variant="outlined"
						size="small"
						fullWidth
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={handleKeyDown}
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
					disabled={isLoading || !name}
					onClick={() => createFile()}
				>
					Create
				</Button>
			</Modal.Actions>
			{isLoading && <LinearProgress />}
		</>
	);
};
