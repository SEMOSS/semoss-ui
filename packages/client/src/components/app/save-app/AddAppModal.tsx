import { ExternalLink, Eye, Pencil } from "lucide-react";
import type React from "react";
import { type Dispatch, type SetStateAction, useState } from "react";
import type { Control } from "react-hook-form";
import { toast } from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { AppAccessStep } from "./AppAccessStep";
import { AppDetailsAndTagsStep } from "./AppDetailsAndTagsStep";
import { AppUploadStep } from "./AppUploadStep";
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

const MODAL_CONFIG = {
	app: {
		title: "Upload app from my computer",
		errorMessage:
			"There was an error creating your app. Please check your zip file and try again.",
	},
	skill: {
		title: "Upload skill from my computer",
		errorMessage:
			"There was an error creating your skill. Please check your zip file and try again.",
	},
} as const;

interface AddAppProps {
	open: boolean;
	handleClose: (appId?: string) => void;
	type?: keyof typeof MODAL_CONFIG;
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
			icon: <ExternalLink className="size-4" />,
			title: "Upload a zip file",
			component: addAppUploadStep,
			requiredFields: [
				ADD_APP_FORM_FIELD_UPLOAD,
				ADD_APP_FORM_FIELD_TYPE,
			],
		},
		{
			name: "Access",
			icon: <Eye className="size-4" />,
			title: "Access",
			component: AppAccessStep,
			requiredFields: [],
		},
	];

	const projectZipFormSteps = [
		{
			name: "Upload",
			icon: <ExternalLink className="size-4" />,
			title: "Upload a zip file",
			component: addAppUploadStep,
			requiredFields: [
				ADD_APP_FORM_FIELD_UPLOAD,
				ADD_APP_FORM_FIELD_TYPE,
			],
		},
		{
			name: "Details",
			icon: <Pencil className="size-4" />,
			title: "Details",
			component: AppDetailsAndTagsStep,
			requiredFields: [],
		},
		{
			name: "Access",
			icon: <Eye className="size-4" />,
			title: "Access",
			component: AppAccessStep,
			requiredFields: [],
		},
	];

	const [_addAppFormSteps, setAddAppFormSteps] =
		useState<AddAppFormStep[]>(appZipFormSteps);

	const { open, handleClose, type = "app" } = props;
	const config = MODAL_CONFIG[type];
	const { monolithStore, configStore } = useRootStore();

	const defaultFormValues: AddAppForm = {
		[ADD_APP_FORM_FIELD_NAME]: "",
		[ADD_APP_FORM_FIELD_DESCRIPTION]: "",
		[ADD_APP_FORM_FIELD_APP_TYPE]: "",
		[ADD_APP_FORM_FIELD_TAGS]: [],
		[ADD_APP_FORM_FIELD_UPLOAD]: null,
		[ADD_APP_FORM_FIELD_IS_GLOBAL]: false,
		[ADD_APP_FORM_FIELD_TYPE]: "App Zip",
	};

	const createApp = async (data: AddAppForm) => {
		if (data[ADD_APP_FORM_FIELD_TYPE] === "App Zip") {
			const upload = await uploadFile(
				[data[ADD_APP_FORM_FIELD_UPLOAD]],
				configStore.store.insightID,
			);
			const resp = await monolithStore.runQuery(
				`UploadProjectApp(filePath=["${upload[0].fileLocation}"], global=[${data[ADD_APP_FORM_FIELD_IS_GLOBAL]}]);`,
			);

			const output = resp.pixelReturn[0].output;
			const type = resp.pixelReturn[0].operationType[0];

			if (type.indexOf("ERROR") > -1) {
				toast.error(output);
				return;
			}
			handleClose(output.project_id);
		} else {
			const createProjectResponse = await monolithStore.runQuery(
				`CreateProject(project=["${data[ADD_APP_FORM_FIELD_NAME]}"], global=["${data[ADD_APP_FORM_FIELD_IS_GLOBAL]}"], projectType=["${data[ADD_APP_FORM_FIELD_APP_TYPE]}"], portal=["true"])`,
			);

			const createProjectOutput =
				createProjectResponse.pixelReturn[0].output;
			const type = createProjectResponse.pixelReturn[0].operationType[0];

			if (type.indexOf("ERROR") > -1) {
				toast.error(createProjectOutput);
				return;
			}

			const setProjectMetadataResponse = await monolithStore.runQuery(
				`SetProjectMetadata(project=["${
					createProjectOutput.project_id
				}"], meta=[${JSON.stringify({
					tag: data.tags,
					description: data.description,
				})}])`,
			);

			const projectOutput =
				setProjectMetadataResponse.pixelReturn[0].output;
			const projectType =
				setProjectMetadataResponse.pixelReturn[0].operationType[0];

			if (projectType.indexOf("ERROR") > -1) {
				toast.error(projectOutput);
				return;
			}

			const deleteAssetResponse = await monolithStore.runQuery(
				`DeleteAsset(filePath=["version/assets/"], space=["${createProjectOutput.project_id}"]);`,
			);
			const deleteAssetOutput = deleteAssetResponse.pixelReturn[0].output;
			const deleteAssetType =
				deleteAssetResponse.pixelReturn[0].operationType[0];

			if (deleteAssetType.indexOf("ERROR") > -1) {
				toast.error(deleteAssetOutput);
				return;
			}

			const upload = await uploadFile(
				[data[ADD_APP_FORM_FIELD_UPLOAD]],
				configStore.store.insightID,
				createProjectOutput.project_id,
				"version",
			);

			const unzipFileResponse = await monolithStore.runQuery(
				`UnzipFile(filePath=["${upload[0].fileLocation}"], space=["${createProjectOutput.project_id}"]);`,
			);

			const unzipOutput = unzipFileResponse.pixelReturn[0].output;
			const unzipType = unzipFileResponse.pixelReturn[0].operationType[0];

			if (unzipType.indexOf("ERROR") > -1) {
				toast.error(unzipOutput);
				return;
			}

			handleClose(createProjectOutput.project_id);
		}
	};

	return (
		<SaveAppModal
			open={open}
			handleClose={handleClose}
			title={config.title}
			steps={projectZipFormSteps}
			defaultFormValues={defaultFormValues}
			handleFormSubmit={createApp}
			errorMessage={config.errorMessage}
			submitBtnText="Upload"
		/>
	);
};
