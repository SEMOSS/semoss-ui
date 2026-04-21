import { CircleDot, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
	Block,
	BlockDef,
	Paths,
	PathValue,
	RadioBlockDef,
} from "@semoss/renderer";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
import { InputSettings } from "../../settings";
import { BaseSettingSection } from "../../settings/BaseSettingSection";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

// Define options
const SIZE_OPTIONS = [
	{ label: "Small", value: "small" },
	{ label: "Medium", value: "medium" },
];

const DIRECTION_OPTIONS = [
	{ label: "Row", value: "row" },
	{ label: "Column", value: "column" },
];

const COLOR_OPTIONS = [
	{ label: "Primary", value: "primary" },
	{ label: "Secondary", value: "secondary" },
	{ label: "Error", value: "error" },
	{ label: "Info", value: "info" },
	{ label: "Success", value: "success" },
	{ label: "Warning", value: "warning" },
	{ label: "Default", value: "default" },
];

const LABEL_PLACEMENT_OPTIONS = [
	{ label: "Start", value: "start" },
	{ label: "End", value: "end" },
	{ label: "Top", value: "top" },
	{ label: "Bottom", value: "bottom" },
];

const SettingAutocomplete = <D extends BlockDef>({
	id,
	path,
	options,
	initialValue,
}: {
	id: string;
	path: Paths<Block<D>["data"], 4>;
	options: Array<{ label: string; value: string }>;
	label: string;
	initialValue?: string;
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
			} catch (e) {
				console.log(e);
			}
		}, 300);
	};

	return (
		<Select
			value={selectedValue ?? ""}
			onValueChange={(val) => setBlockData(val)}
		>
			<SelectTrigger className="w-full">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{options.map((opt) => (
					<SelectItem key={opt.value} value={opt.value}>
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

interface ConfigOption {
	id: string;
	label: string;
	value: string;
}

const OptionRow = ({
	label,
	value,
	onChange,
	onDelete,
}: {
	label: string;
	value: string;
	onChange?: (field: "label" | "value", value: string) => void;
	onDelete?: () => void;
}) => (
	<div className="mb-2 w-full">
		<div className="flex flex-row items-center gap-2">
			<div className="flex-1">
				<Input
					value={label}
					onChange={(e) => onChange?.("label", e.target.value)}
				/>
			</div>
			<div className="flex-1">
				<Input
					value={value}
					onChange={(e) => onChange?.("value", e.target.value)}
				/>
			</div>

			<Button variant="ghost" size="icon-sm" onClick={onDelete}>
				<X className="size-4" />
			</Button>
		</div>
	</div>
);

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: CircleDot,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Label",
					render: ({ id }) => (
						<InputSettings id={id} label="Label" path="label" />
					),
				},
				{
					description: "Options Management",
					render: ({ id }) => {
						const { data, setData } =
							useBlockSettings<RadioBlockDef>(id);
						const [nextId, setNextId] = useState(
							data.options.length,
						);
						const [configOptions, setConfigOptions] = useState<
							ConfigOption[]
						>(() => {
							// Initialize with default if no options exist
							if (!data.options.length) {
								return [
									{
										id: "option-0",
										label: "Default",
										value: "no_value",
									},
								];
							}
							return data.options.map((opt, index) => ({
								id: `option-${index}`,
								label: opt.label,
								value: opt.value,
							}));
						});

						// Ensure we always have at least one complete option
						// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only run when configOptions length changes
						useEffect(() => {
							const completeOptions = configOptions.filter(
								(opt) => opt.label.trim() && opt.value.trim(),
							);
							if (completeOptions.length === 0) {
								// Reset to default state
								const defaultOption = {
									id: "option-0",
									label: "Default",
									value: "no_value",
								};
								setConfigOptions([defaultOption]);
								setData("options", [
									{ label: "Default", value: "no_value" },
								]);
								setData("value", "no_value");
							}
						}, [configOptions]);

						const handleOptionChange = (
							optionId: string,
							field: "label" | "value",
							newValue: string,
						) => {
							const updatedOptions = configOptions.map((opt) =>
								opt.id === optionId
									? { ...opt, [field]: newValue }
									: opt,
							);
							setConfigOptions(updatedOptions);

							// Only update the actual radio options with options that have both label and value
							const completeOptions = updatedOptions
								.filter(
									(opt) =>
										opt.label.trim() && opt.value.trim(),
								)
								.map((opt) => ({
									label: opt.label,
									value: opt.value,
								}));

							if (completeOptions.length > 0) {
								setData("options", completeOptions);
							}

							if (
								field === "value" &&
								data.value ===
									configOptions.find(
										(opt) => opt.id === optionId,
									)?.value
							) {
								setData("value", newValue);
							}
						};

						const handleAddOption = () => {
							const newId = `option-${nextId}`;
							const newOptions = [
								...configOptions,
								{ id: newId, label: "", value: "" },
							];
							setConfigOptions(newOptions);
							setNextId(nextId + 1);
						};

						const handleDeleteOption = (optionId: string) => {
							const remainingOptions = configOptions.filter(
								(opt) => opt.id !== optionId,
							);

							const completeRemainingOptions =
								remainingOptions.filter(
									(opt) =>
										opt.label.trim() && opt.value.trim(),
								);

							if (completeRemainingOptions.length === 0) {
								// If deleting would leave us with no complete options,
								// reset to default state
								const defaultOption = {
									id: "option-0",
									label: "Default",
									value: "no_value",
								};
								setConfigOptions([defaultOption]);
								setData("options", [
									{ label: "Default", value: "no_value" },
								]);
								setData("value", "no_value");
							} else {
								setConfigOptions(remainingOptions);
								setData(
									"options",
									completeRemainingOptions.map((opt) => ({
										label: opt.label,
										value: opt.value,
									})),
								);

								const deletedOption = configOptions.find(
									(opt) => opt.id === optionId,
								);
								if (data.value === deletedOption?.value) {
									setData(
										"value",
										completeRemainingOptions[0].value,
									);
								}
							}
						};
						// Find the current option object for the selected value
						return (
							<div className="w-full">
								{/* Headers */}
								<div className="mb-2 flex gap-2">
									<div className="flex-1">
										<p className="font-medium text-xs">
											Label
										</p>
									</div>
									<div className="flex-1">
										<p className="font-medium text-xs">
											Value
										</p>
									</div>
									<div className="w-10" />
								</div>

								{/* Options */}
								{configOptions.map((option) => (
									<OptionRow
										key={option.id}
										label={option.label}
										value={option.value}
										onChange={(field, value) =>
											handleOptionChange(
												option.id,
												field,
												value,
											)
										}
										onDelete={() =>
											handleDeleteOption(option.id)
										}
									/>
								))}

								{/* Add Button */}
								<Button
									variant="outline"
									size="sm"
									className="mb-2 w-full"
									onClick={handleAddOption}
								>
									<Plus className="mr-1 size-4" />
									Add Option
								</Button>

								{/* Current Value Selection */}
								<BaseSettingSection label="Selected Value">
									<Select
										value={
											configOptions.find(
												(opt) =>
													opt.value === data.value,
											)?.value ?? ""
										}
										onValueChange={(val) => {
											setData("value", val);
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{configOptions
												.filter(
													(opt) =>
														opt.label.trim() &&
														opt.value.trim(),
												)
												.map((opt) => (
													<SelectItem
														key={opt.id}
														value={opt.value}
													>
														{opt.label}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</BaseSettingSection>
							</div>
						);
					},
				},
				{
					description: "Required",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Required"
							path="required"
						/>
					),
				},
				{
					description: "Disabled",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Disabled"
							path="disabled"
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
	styleMenu: [
		{
			name: "Dimensions",
			children: [
				{
					description: "Size",
					render: ({ id }) => {
						return (
							<BaseSettingSection label="Size">
								<SettingAutocomplete
									id={id}
									path="size"
									options={SIZE_OPTIONS}
									label="Size"
									initialValue="medium"
								/>
							</BaseSettingSection>
						);
					},
				},
			],
		},
		{
			name: "Layout",
			children: [
				{
					description: "Label Placement",
					render: ({ id }) => {
						return (
							<BaseSettingSection label="Label Placement">
								<SettingAutocomplete
									id={id}
									path="labelPlacement"
									options={LABEL_PLACEMENT_OPTIONS}
									label="Label Placement"
									initialValue="end"
								/>
							</BaseSettingSection>
						);
					},
				},
				{
					description: "Direction",
					render: ({ id }) => {
						return (
							<BaseSettingSection label="Direction">
								<SettingAutocomplete
									id={id}
									path="direction"
									options={DIRECTION_OPTIONS}
									label="Direction"
									initialValue="row"
								/>
							</BaseSettingSection>
						);
					},
				},
			],
		},
		{
			name: "Color",
			children: [
				{
					description: "Color",
					render: ({ id }) => {
						return (
							<BaseSettingSection label="Color">
								<SettingAutocomplete
									id={id}
									path="color"
									options={COLOR_OPTIONS}
									label="Color"
									initialValue="primary"
								/>
							</BaseSettingSection>
						);
					},
				},
			],
		},
	],
};
