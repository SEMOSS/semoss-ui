import {
	Edit,
	LocalOffer,
	OpenInBrowser,
	Visibility,
} from "@mui/icons-material";
import type React from "react";
import { type Dispatch, type SetStateAction, useState } from "react";
import type { Control } from "react-hook-form";
import { useNotification } from "@semoss/ui";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import {
	createProjectPixel,
	deleteVersionAssetsPixel,
	setProjectMetadataPixel,
	unzipFilePixel,
	uploadProjectAppPixel,
} from "@/pixel/projects";
import { useEngineDependenciesState } from "@/utility/engineDependencies";
import { AppAccessStep } from "./AppAccessStep";
import { AppDetailsStep } from "./AppDetailsStep";
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
	const addAppUploadStep = (props: { control: Control<any, any> }) => (
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
			name: "Details",
			icon: <Edit />,
			title: "Details",
			component: AppDetailsStep,
			requiredFields: [
				ADD_APP_FORM_FIELD_DESCRIPTION,
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

	const [addAppFormSteps, setAddAppFormSteps] =
		useState<AddAppFormStep[]>(appZipFormSteps);

	const { open, handleClose } = props;

	const { configStore } = useRootStore();
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
		const insightId = configStore.store.insightID;
		try {
			if (data[ADD_APP_FORM_FIELD_TYPE] === "App Zip") {
				const upload = await uploadFile(
					[data[ADD_APP_FORM_FIELD_UPLOAD]],
					insightId,
				);

				// *** Waiting on the ImportApp reactor to be ready so that we can hook up the metadata ****.
				const uploadOutput = await uploadProjectAppPixel(
					upload[0].fileLocation,
					data[ADD_APP_FORM_FIELD_IS_GLOBAL],
					insightId,
				);

				updateEngineDependencies(uploadOutput.engineIds);
				setPendingProjectId(uploadOutput.project_id);

				if (
					data[ADD_APP_FORM_FIELD_TAGS].length > 0 ||
					data[ADD_APP_FORM_FIELD_DESCRIPTION]
				) {
					await setProjectMetadataPixel(
						uploadOutput.project_id,
						data[ADD_APP_FORM_FIELD_TAGS],
						data[ADD_APP_FORM_FIELD_DESCRIPTION] || "",
						insightId,
					);
				}
				setShowEngineModal(true);
			} else {
				const createOutput = await createProjectPixel(
					data[ADD_APP_FORM_FIELD_NAME],
					data[ADD_APP_FORM_FIELD_IS_GLOBAL],
					data[ADD_APP_FORM_FIELD_APP_TYPE],
					insightId,
				);

				await setProjectMetadataPixel(
					createOutput.project_id,
					data[ADD_APP_FORM_FIELD_TAGS],
					data[ADD_APP_FORM_FIELD_DESCRIPTION],
					insightId,
				);

				await deleteVersionAssetsPixel(
					createOutput.project_id,
					insightId,
				);

				const upload = await uploadFile(
					[data[ADD_APP_FORM_FIELD_UPLOAD]],
					configStore.store.insightID,
					createOutput.project_id,
					"version",
				);

				await unzipFilePixel(
					upload[0].fileLocation,
					createOutput.project_id,
					insightId,
				);
				// close it

				handleClose(createOutput.project_id);
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: `Error creating app: ${e instanceof Error ? e.message : String(e)}`,
			});
			handleClose();
		}
	};

	const handleEngineModalClose = () => {
		setShowEngineModal(false);
		handleClose(pendingProjectId);
	};

	return (
		<>
			<SaveAppModal
				open={open && !showEngineModal}
				handleClose={handleClose}
				title="Upload app from my computer"
				steps={addAppFormSteps}
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
