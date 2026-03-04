import { type Dispatch, type SetStateAction, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { FileDropzone, Select, Stack } from "@semoss/ui";
import type { AddAppFormStep } from "./AddAppModal";
import {
	ADD_APP_FORM_FIELD_APP_TYPE,
	ADD_APP_FORM_FIELD_TYPE,
	ADD_APP_FORM_FIELD_UPLOAD,
} from "./save-app.constants";

const FOLDER_TYPE_OPTIONS = [
	{
		display: "App Zip",
		value: "App Zip",
		description:
			"Contains full semoss construct. .smss, and other specific folders",
	},
	{
		display: "Assets Copy",
		value: "Assets Copy",
		description: "Contains project zipped as assets",
	},
];

export const AppUploadStep = (props: {
	control: Control<any, any>;
	setAddAppFormSteps: Dispatch<SetStateAction<AddAppFormStep[]>>;
	appZipFormSteps: AddAppFormStep[];
	projectZipFormSteps: AddAppFormStep[];
}) => {
	const {
		control,
		setAddAppFormSteps,
		appZipFormSteps,
		projectZipFormSteps,
	} = props;

	const [isZip, setIsZip] = useState(true);

	return (
		<Stack direction="column">
			<Controller
				name={ADD_APP_FORM_FIELD_UPLOAD}
				control={control}
				rules={{ required: true }}
				render={({ field }) => {
					return (
						<FileDropzone
							multiple={false}
							value={field.value}
							onChange={(newValues) => {
								field.onChange(newValues);
							}}
							extensions={[".zip"]}
						/>
					);
				}}
			/>
			<Controller
				name={ADD_APP_FORM_FIELD_TYPE}
				control={control}
				render={({ field }) => {
					return (
						<Select
							label="Folder Type"
							value={field.value}
							defaultValue={"App Zip"}
							onChange={(value) => {
								field.onChange(value);
								setAddAppFormSteps(
									value.target.value === "App Zip"
										? appZipFormSteps
										: projectZipFormSteps,
								);

								if (value.target.value === "App Zip") {
									setIsZip(true);
								} else {
									setIsZip(false);
								}
							}}
						>
							{FOLDER_TYPE_OPTIONS.map((option, idx) => (
								<Select.Item key={idx} value={option.value}>
									{option.display}
								</Select.Item>
							))}
						</Select>
					);
				}}
			/>

			<Controller
				name={ADD_APP_FORM_FIELD_APP_TYPE}
				control={control}
				rules={{ required: true }}
				render={({ field }) => {
					return isZip ? (
						<></>
					) : (
						<Select
							label="App Type"
							value={field.value}
							defaultValue={"Assets Copy"}
							onChange={(value) => {
								field.onChange(value);
							}}
						>
							{["CODE", "BLOCKS"].map((option, idx) => (
								<Select.Item key={idx} value={option}>
									{option}
								</Select.Item>
							))}
						</Select>
					);
				}}
			/>
		</Stack>
	);
};
