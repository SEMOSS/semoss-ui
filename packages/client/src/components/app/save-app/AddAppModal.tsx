import { LocalOffer, OpenInBrowser, Visibility } from "@mui/icons-material";
import type React from "react";
import { type Dispatch, type SetStateAction, useState } from "react";
import type { Control } from "react-hook-form";
import { useNotification } from "@semoss/ui";
import { useRootStore } from "@/hooks";
import {
	createProject,
	updateProjectDetails,
	uploadProjectApp,
} from "@/pixel/projects";
import { useEngineDependenciesState } from "@/utility/engineDependencies";
import { AppAccessStep } from "./AppAccessStep";
import { AppTagsStep } from "./AppTagsStep";
import { AppUploadStep } from "./AppUploadStep";
import EngineIdsModal from "./EngineIdsModal";
import { SaveAppModal } from "./SaveAppModal";
import {
	ADD_APP_FORM_FIELD_APP_TYPE,
	ADD_APP_FORM_FIELD_DESCRIPTION,
	ADD_APP_FORM_FIELD_IS_GLOBAL,
	ADD_APP_FORM_FIELD_NAME,
	ADD_APP_FORM_FIELD_TAGS,
	ADD_APP_FORM_FIELD_TYPE,
	ADD_APP_FORM_FIELD_UPLOAD,
} from "./save-app.constants";

type AddAppForm = {
	[ADD_APP_FORM_FIELD_NAME]: string;
	[ADD_APP_FORM_FIELD_APP_TYPE]: string;
	[ADD_APP_FORM_FIELD_DESCRIPTION]: string;
	[ADD_APP_FORM_FIELD_TAGS]: string[];
	[ADD_APP_FORM_FIELD_UPLOAD]: File;
	[ADD_APP_FORM_FIELD_IS_GLOBAL]: boolean;
	[ADD_APP_FORM_FIELD_TYPE]: string;
};

export type AddAppFormStep = {
	name: string;
	icon: React.ReactElement;
	title: string;
	component: React.FunctionComponent<{
		control: Control<unknown, unknown>;
		disabled: boolean;
		setAddAppFormSteps?: Dispatch<SetStateAction<AddAppFormStep[]>>;
		appZipFormSteps?: AddAppFormStep[];
		projectZipFormSteps?: AddAppFormStep[];
	}>;
	requiredFields: string[];
};

interface AddAppProps {
	/** Track if the model is open */
	open: boolean;

	/** Callback that is triggered on close */
	handleClose: (appId?: string) => void;
}

export const AddAppModal = (props: AddAppProps) => {
	const addAppUploadStep = (props: {
		control: Control<unknown, unknown>;
	}) => (
		<AppUploadStep
			control={props.control}
			setAddAppFormSteps={setAddAppFormSteps}
			appZipFormSteps={appZipFormSteps}
			projectZipFormSteps={projectZipFormSteps}
		/>
	);

	const appZipFormSteps = [
		{
			name: "Upload",
			icon: <OpenInBrowser />,
			title: "Upload a zip file",
			component: addAppUploadStep,
			requiredFields: [
				ADD_APP_FORM_FIELD_UPLOAD,
				ADD_APP_FORM_FIELD_TYPE,
			],
		},

		{
			name: "Access",
			icon: <Visibility />,
			title: "Access",
			component: AppAccessStep,
			requiredFields: [],
		},
	];

	const projectZipFormSteps = [
		{
			name: "Upload",
			icon: <OpenInBrowser />,
			title: "Upload a zip file",
			component: addAppUploadStep,
			requiredFields: [
				ADD_APP_FORM_FIELD_UPLOAD,
				ADD_APP_FORM_FIELD_TYPE,
			],
		},
		{
			name: "Tags",
			icon: <LocalOffer />,
			title: "Tags",
			component: AppTagsStep,
			requiredFields: [],
		},
		{
			name: "Access",
			icon: <Visibility />,
			title: "Access",
			component: AppAccessStep,
			requiredFields: [],
		},
	];

	const [_addAppFormSteps, setAddAppFormSteps] =
		useState<AddAppFormStep[]>(appZipFormSteps);

	const { open, handleClose } = props;

	const { monolithStore, configStore } = useRootStore();
	const notification = useNotification();
	const [showEngineModal, setShowEngineModal] = useState(false);
	const [pendingProjectId, setPendingProjectId] = useState<
		string | undefined
	>();
	const { engineDependenciesState, updateEngineDependencies } =
		useEngineDependenciesState();

	const defaultFormValues: AddAppForm = {
		[ADD_APP_FORM_FIELD_NAME]: "",
		[ADD_APP_FORM_FIELD_DESCRIPTION]: "",
		[ADD_APP_FORM_FIELD_APP_TYPE]: "",
		[ADD_APP_FORM_FIELD_TAGS]: [],
		[ADD_APP_FORM_FIELD_UPLOAD]: null,
		[ADD_APP_FORM_FIELD_IS_GLOBAL]: false,
		[ADD_APP_FORM_FIELD_TYPE]: "App Zip",
	};

	/**
	 * Method that is called to create the app
	 */
	const createApp = async (data: AddAppForm) => {
		// upload the file

		if (data[ADD_APP_FORM_FIELD_TYPE] === "App Zip") {
			const upload = await monolithStore.uploadFile(
				[data[ADD_APP_FORM_FIELD_UPLOAD]],
				configStore.store.insightID,
			);
			// *** Waiting on the ImportApp reactor to be ready so that we can hook up the metadata ****.
			const uploadResult = await uploadProjectApp(
				upload[0].fileLocation,
				data[ADD_APP_FORM_FIELD_IS_GLOBAL],
			);

			if (uploadResult.type === "error") {
				notification.add({
					color: "error",
					message: String(uploadResult.output),
				});
				return;
			}

			const output = uploadResult.output as {
				project_id: string;
				engineIds?: unknown;
			};

			// Process engine dependencies using utility function
			if (output.engineIds) {
				updateEngineDependencies(output.engineIds);
			}

			// setIsUploadProjectApp(true);
			setPendingProjectId(output.project_id);
			setShowEngineModal(true);
		} else {
			const createResult = await createProject(
				data[ADD_APP_FORM_FIELD_NAME],
				data[ADD_APP_FORM_FIELD_IS_GLOBAL],
				data[ADD_APP_FORM_FIELD_APP_TYPE],
				true,
			);

			if (createResult.type === "error") {
				notification.add({
					color: "error",
					message: String(createResult.output),
				});
				return;
			}

			const createProjectOutput = createResult.output as {
				project_id: string;
			};

			const metadataResult = await updateProjectDetails(
				createProjectOutput.project_id,
				{
					tag: data.tags,
					description: data.description,
				},
			);

			if (metadataResult.type === "error") {
				notification.add({
					color: "error",
					message: String(metadataResult.output),
				});
				return;
			}

			const deleteAssetResponse = await monolithStore.runQuery(
				`DeleteAsset(filePath=["version/assets/"], space=["${createProjectOutput.project_id}"]);`,
			);

			let output = deleteAssetResponse.pixelReturn[0].output;
			let type = deleteAssetResponse.pixelReturn[0].operationType[0];

			if (type.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: output,
				});

				return;
			}

			const upload = await monolithStore.uploadFile(
				[data[ADD_APP_FORM_FIELD_UPLOAD]],
				configStore.store.insightID,
				createProjectOutput.project_id,
				"version",
			);

			const unzipFileResponse = await monolithStore.runQuery(
				`UnzipFile(filePath=["${upload[0].fileLocation}"], space=["${createProjectOutput.project_id}"]);`,
			);

			output = unzipFileResponse.pixelReturn[0].output;
			type = unzipFileResponse.pixelReturn[0].operationType[0];

			if (type.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: output,
				});

				return;
			}
			// close it

			handleClose(createProjectOutput.project_id);
		}
	};
	const handleEngineModalClose = () => {
		setShowEngineModal(false);
		handleClose(pendingProjectId);
	};

	return (
		<>
			<SaveAppModal
				open={open}
				handleClose={handleClose}
				title="Upload app from my computer"
				steps={projectZipFormSteps}
				defaultFormValues={defaultFormValues}
				handleFormSubmit={createApp}
				errorMessage="There was an error creating your app. Please check your zip file and try again."
				submitBtnText="Upload"
			/>
			<EngineIdsModal
				open={showEngineModal}
				successIds={engineDependenciesState.successfulEngineIds}
				failedIds={engineDependenciesState.failedEngineIds}
				onClose={handleEngineModalClose}
				appId={pendingProjectId || ""}
				isUploadProjectApp={true}
				engineInfo={engineDependenciesState.engineDetails}
			/>
		</>
	);
};
