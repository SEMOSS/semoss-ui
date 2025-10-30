import { Schema } from "@mui/icons-material";
import { useRef, useState } from "react";
import type { Block, BlockDef, Paths, PathValue } from "@semoss/renderer";
import { Autocomplete, TextField } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { InputSettings, QueryInputSettings } from "../../settings";
import { BaseSettingSection } from "../../settings/BaseSettingSection";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// Size options for both min and max width
const WIDTH_OPTIONS = [
	{ value: "xs", label: "Extra Small (444px)" },
	{ value: "sm", label: "Small (600px)" },
	{ value: "md", label: "Medium (900px)" },
	{ value: "lg", label: "Large (1200px)" },
	{ value: "xl", label: "Extra Large (1536px)" },
];

const SettingAutocomplete = <D extends BlockDef>({
	id,
	path,
	options,
	initialValue,
	onValueChange,
}: {
	id: string;
	path: Paths<Block<D>["data"], 4>;
	options: Array<{ label: string; value: string }>;
	label: string;
	initialValue?: string;
	onValueChange?: (value: string) => void;
}) => {
	const { data, setData } = useBlockSettings<D>(id);
	const [selectedValue, setSelectedValue] = useState(
		data[path] || initialValue,
	);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	const setBlockData = (newValue: string | undefined) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		timeoutRef.current = setTimeout(() => {
			try {
				setData(path, newValue as PathValue<D["data"], typeof path>);
				setSelectedValue(newValue);
				if (onValueChange) {
					onValueChange(newValue || "");
				}
			} catch (e) {
				console.log(e);
			}
		}, 300);
	};

	return (
		<Autocomplete
			fullWidth
			options={options}
			multiple={false}
			value={options.find((opt) => opt.value === selectedValue) || null}
			onChange={(_, newValue) => {
				setBlockData(
					typeof newValue === "object" && newValue !== null
						? newValue.value
						: undefined,
				);
			}}
			getOptionLabel={(option) =>
				typeof option === "object" && option !== null
					? option.label
					: ""
			}
			isOptionEqualToValue={(option, value) =>
				typeof option === "object" &&
				option !== null &&
				typeof value === "object" &&
				value !== null &&
				"value" in option &&
				"value" in value &&
				option.value === value.value
			}
			renderInput={(params) => (
				<TextField {...params} size="small" variant="outlined" />
			)}
		/>
	);
};

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: Schema,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Design Mode",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Design Mode"
							path="designMode"
							description="Enable to edit modal content"
						/>
					),
				},
				{
					description: "Title",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Modal Title"
							path="title"
						/>
					),
				},
			],
		},
		{
			name: "Conditional",
			children: [
				...buildShowField(),
				{
					description: "Open",
					render: ({ id }) => (
						<QueryInputSettings
							id={id}
							label="Open Modal"
							path="open"
						/>
					),
				},
			],
		},
		{
			name: "Pre Process",
			children: [...buildListener("preProcess")],
		},
		{
			name: "On Close",
			children: [...buildListener("onClose")],
		},
	],
	styleMenu: [
		{
			name: "Dimensions",
			children: [
				{
					description: "Full Width",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Full Width"
							path="fullWidth"
						/>
					),
				},
				{
					description: "Min Width",
					render: ({ id }) => (
						<BaseSettingSection label="Min Width">
							<SettingAutocomplete
								id={id}
								path="minWidth"
								options={WIDTH_OPTIONS}
								label="Min Width"
							/>
						</BaseSettingSection>
					),
				},
				{
					description: "Max Width",
					render: ({ id }) => (
						<BaseSettingSection label="Max Width">
							<SettingAutocomplete
								id={id}
								path="maxWidth"
								options={WIDTH_OPTIONS}
								label="Max Width"
							/>
						</BaseSettingSection>
					),
				},
			],
		},
	],
};
