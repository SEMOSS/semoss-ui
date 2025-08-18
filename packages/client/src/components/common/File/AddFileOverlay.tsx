import { useState } from "react";
import {
	Button,
	Checkbox,
	FileDropzone,
	LinearProgress,
	Modal,
	Stack,
	Typography,
} from "@semoss/ui";
import EngineIdsModal from "@/components/app/save-app/EngineIdsModal";
import { useRootStore } from "@/hooks";
import {
	extractAndSetDependenciesPixel,
	unzipFilePixel,
} from "@/pixel/projects";
import { useEngineDependenciesState } from "@/utility/engineDependencies";

type ExtractOutput = { engineIds: Record<string, unknown> };

interface AddFileOverlayProps {
	/** Type of file opened */
	type: "app" | "insight";

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
	const [showEngineIdsModal, setShowEngineIdsModal] = useState(false);
	const [pendingUploadPath, setPendingUploadPath] = useState<string | null>(
		null,
	);
	const { engineDependenciesState, updateEngineDependencies } =
		useEngineDependenciesState();

	const handleEngineIdsModalClose = () => {
		setShowEngineIdsModal(false);
		if (pendingUploadPath) {
			onClose(true, pendingUploadPath);
			setPendingUploadPath(null);
		}
	};

	/**
	 * Add the file to the app
	 */
	const addFile = async () => {
		try {
			setIsLoading(true);

			let upload = null;
			if (type === "app") {
				upload = await monolithStore.uploadFile(
					[uploadFile],
					configStore.store.insightID,
					space,
					uploadPath,
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
					await unzipFilePixel(
						path,
						space,
						configStore.store.insightID,
					);
					const extractResult =
						await extractAndSetDependenciesPixel(space);
					const extractOutput: ExtractOutput =
						extractResult.output &&
						typeof extractResult.output === "object" &&
						"engineIds" in extractResult.output
							? (extractResult.output as ExtractOutput)
							: { engineIds: {} };
					// Process engine dependencies using utility function
					updateEngineDependencies(extractOutput.engineIds);
					setPendingUploadPath(path);
					setShowEngineIdsModal(true);
					return;
				} else {
					throw new Error("TODO");
				}
			}

			onClose(true, path);
		} catch (e) {
			console.error(e);
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
					<FileDropzone
						multiple={false}
						value={uploadFile}
						disabled={isLoading}
						onChange={(newValue: File) => {
							setUploadFiles(newValue);
						}}
					/>
					<Checkbox
						checked={unzipFile}
						onChange={() => {
							setUnzipFile(!unzipFile);
						}}
						label={<Typography variant="body2">Unzip?</Typography>}
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
					disabled={isLoading}
					onClick={() => addFile()}
				>
					Upload
				</Button>
			</Modal.Actions>
			{isLoading && <LinearProgress />}
			<EngineIdsModal
				open={showEngineIdsModal}
				successIds={engineDependenciesState.successfulEngineIds}
				failedIds={engineDependenciesState.failedEngineIds}
				onClose={handleEngineIdsModalClose}
				appId={space}
				isUploadProjectApp={false}
				engineInfo={engineDependenciesState.engineDetails}
			/>
		</>
	);
};
