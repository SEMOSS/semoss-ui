import type { Dispatch, SetStateAction } from "react";
import { useId, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { FileDropzone } from "@semoss/ui";
import {
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
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
	// biome-ignore lint/suspicious/noExplicitAny: react-hook-form generic
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
	const folderTypeId = useId();
	const appTypeId = useId();

	return (
		<div className="flex flex-col gap-3">
			<Controller
				name={ADD_APP_FORM_FIELD_UPLOAD}
				control={control}
				rules={{ required: true }}
				render={({ field }) => (
					<FileDropzone
						multiple={false}
						value={field.value}
						onChange={(newValues) => field.onChange(newValues)}
						extensions={[".zip"]}
					/>
				)}
			/>
			<Controller
				name={ADD_APP_FORM_FIELD_TYPE}
				control={control}
				render={({ field }) => (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={folderTypeId}>Folder Type</Label>
						<Select
							value={field.value}
							defaultValue="App Zip"
							onValueChange={(val) => {
								field.onChange(val);
								setAddAppFormSteps(
									val === "App Zip"
										? appZipFormSteps
										: projectZipFormSteps,
								);
								setIsZip(val === "App Zip");
							}}
						>
							<SelectTrigger id={folderTypeId} className="w-full">
								<SelectValue placeholder="Select folder type" />
							</SelectTrigger>
							<SelectContent>
								{FOLDER_TYPE_OPTIONS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.display}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			/>
			<Controller
				name={ADD_APP_FORM_FIELD_APP_TYPE}
				control={control}
				rules={{ required: true }}
				render={({ field }) =>
					isZip ? null : (
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={appTypeId}>App Type</Label>
							<Select
								value={field.value}
								defaultValue="Assets Copy"
								onValueChange={(val) => field.onChange(val)}
							>
								<SelectTrigger
									id={appTypeId}
									className="w-full"
								>
									<SelectValue placeholder="Select app type" />
								</SelectTrigger>
								<SelectContent>
									{["CODE", "BLOCKS"].map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)
				}
			/>
		</div>
	);
};
