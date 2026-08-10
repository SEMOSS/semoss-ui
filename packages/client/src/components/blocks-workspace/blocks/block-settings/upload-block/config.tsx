import { Upload } from "lucide-react";
import { InputSettings, QuerySelectionSettings } from "../../settings";
import { SelectSettings } from "../../settings/shared/SelectSettings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { UploadSettings } from "../../settings/shared/UploadSettings";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

const FileTypes: string[] = [
	".csv",
	".txt",
	".jpeg",
	".png",
	".gif",
	".mp3",
	".m4a",
	".wav",
	".mp4",
	".mov",
	".avi",
	".zip",
	".rar",
	".pdf",
	".docx",
	".xlx",
	".xlsx",
	".bat",
	".cmd",
	".sh",
	".img",
	".iso",
	".dmg",
	".js",
];

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: Upload,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Value",
					render: ({ id }) => (
						<UploadSettings
							id={id}
							label="Value"
							path={"value"}
							restrictPath={"extensions"}
						/>
					),
				},
				{
					description: "Extensions",
					render: ({ id }) => (
						<SelectSettings
							id={id}
							label="Extensions"
							path={"extensions"}
							options={FileTypes}
						/>
					),
				},
				{
					description: "Label",
					render: ({ id }) => (
						<InputSettings id={id} label="Label" path="label" />
					),
				},
				{
					description: "Hint",
					render: ({ id }) => (
						<InputSettings id={id} label="Hint" path="hint" />
					),
				},
				{
					description: "Loading",
					render: ({ id }) => (
						<QuerySelectionSettings
							id={id}
							label="Loading"
							path="loading"
							queryPath="isLoading"
						/>
					),
				},
				{
					description: "Multiple Files",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Multiple Files"
							path="multiple"
						/>
					),
				},
			],
		},
		{
			name: "Conditional",
			children: [...buildShowField()],
		},
		{
			name: "Pre Process",
			children: [...buildListener("preProcess")],
		},
		{
			name: "On Change",
			children: [...buildListener("onChange")],
		},
	],
	styleMenu: [],
};
