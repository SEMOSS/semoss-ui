import { Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	INPUT_TYPE_DATABASE,
	INPUT_TYPE_DISPLAY,
	INPUT_TYPE_HELP_TEXT,
	INPUT_TYPE_SELECT,
	INPUT_TYPE_VECTOR,
	INPUT_TYPES,
} from "../../prompt.constants";
import type { Token } from "../../prompt.types";
import { PromptReadonlyInputToken } from "../../shared/token";

const floatingLabelBase: React.CSSProperties = {
	position: "absolute",
	left: "12px",
	pointerEvents: "none",
	transition: "all 0.2s ease",
	backgroundColor: "white",
	paddingInline: "4px",
	fontSize: "16px",
	color: "#6b7280",
};

const floatingLabelResting: React.CSSProperties = {
	...floatingLabelBase,
	top: "50%",
	transform: "translateY(-50%)",
};

const floatingLabelFloated: React.CSSProperties = {
	...floatingLabelBase,
	top: "0",
	transform: "translateY(-50%)",
	fontSize: "13px",
};

const greenItemStyles = `
	[data-highlighted] {
		background-color: #dcfce7 !important;
		color: #166534 !important;
	}
	[data-state="checked"] {
		background-color: #f0fdf4 !important;
	}
`;

export const PromptBuilderInputTypeSelection = (props: {
	inputToken: Token;
	inputType: string | null;
	inputTypeMeta: any;
	cfgLibraryVectorDbs: {
		loading: boolean;
		ids: Array<string>;
		display: Record<string, string>;
	};
	cfgLibraryDatabases: {
		loading: boolean;
		ids: Array<string>;
		display: Record<string, string>;
	};
	setInputType: (
		inputTokenIndex: number,
		inputType: string,
		inputTypeMeta: any,
	) => void;
}) => {
	const [selectOptions, setSelectOptions] = useState<string[]>([]);
	const [newOption, setNewOption] = useState<string>("");
	const [inputTypeOpen, setInputTypeOpen] = useState(false);
	const [metaOpen, setMetaOpen] = useState(false);
	const [optionsFocused, setOptionsFocused] = useState(false);

	const inputTypeHasValue = !!props.inputType;
	const metaHasValue = !!(props.inputTypeMeta ?? "");
	const optionsHasValue = !!newOption;

	// Initialize select options from existing meta data
	useEffect(() => {
		if (
			props.inputType === INPUT_TYPE_SELECT &&
			props.inputTypeMeta?.options
		) {
			setSelectOptions(props.inputTypeMeta.options);
		} else if (props.inputType === INPUT_TYPE_SELECT) {
			setSelectOptions([]);
		}
	}, [props.inputType, props.inputTypeMeta]);

	const showMetaAutocomplete =
		props.inputType === INPUT_TYPE_VECTOR ||
		props.inputType === INPUT_TYPE_DATABASE ||
		props.inputType === INPUT_TYPE_SELECT;

	const getMetaSelectorOptions = (): Array<string> => {
		switch (props.inputType) {
			case INPUT_TYPE_VECTOR:
				return props.cfgLibraryVectorDbs.ids;
			case INPUT_TYPE_DATABASE:
				return props.cfgLibraryDatabases.ids;
			default:
				return [];
		}
	};

	const getMetaSelectorDisplay = (value: string): string => {
		switch (props.inputType) {
			case INPUT_TYPE_VECTOR:
				return props.cfgLibraryVectorDbs.display[value] ?? "";
			case INPUT_TYPE_DATABASE:
				return props.cfgLibraryDatabases.display[value] ?? "";
			case INPUT_TYPE_SELECT:
				return value;
			default:
				return "";
		}
	};

	const getMetaSelectorLabel = (): string => {
		switch (props.inputType) {
			case INPUT_TYPE_VECTOR:
				return "Knowledge Repository";
			case INPUT_TYPE_DATABASE:
				return "Database";
			case INPUT_TYPE_SELECT:
				return "Dropdown Options";
			default:
				return "";
		}
	};

	const parseAndAddOptions = (input: string) => {
		if (input.trim()) {
			const newOptions = input
				.split(",")
				.map((option) => option.trim())
				.filter((option) => option && !selectOptions.includes(option));

			if (newOptions.length > 0) {
				const updatedOptions = [...selectOptions, ...newOptions];
				setSelectOptions(updatedOptions);
				setNewOption("");
				updateSelectInputTypeMeta(updatedOptions);
				return true;
			}
		}
		return false;
	};
	const updateSelectInputTypeMeta = (options: string[]) => {
		props.setInputType(props.inputToken.index, props.inputType, {
			options,
		});
	};

	return (
		<div className="flex items-start justify-between">
			<div>
				<PromptReadonlyInputToken tokenKey={props.inputToken.key} />
			</div>
			<div className="w-7/12">
				<style>{greenItemStyles}</style>
				<div className="flex flex-col gap-4">
					<div style={{ position: "relative" }}>
						<label
							htmlFor={`input-type-select-${props.inputToken.index}`}
							style={
								inputTypeOpen || inputTypeHasValue
									? {
											...floatingLabelFloated,
											color: inputTypeOpen
												? "#16a34a"
												: "#6b7280",
										}
									: floatingLabelResting
							}
						>
							Input Type
						</label>
						<Select
							open={inputTypeOpen}
							onOpenChange={setInputTypeOpen}
							value={props.inputType ?? ""}
							onValueChange={(newInputType: string) => {
								if (newInputType === INPUT_TYPE_SELECT) {
									props.setInputType(
										props.inputToken.index,
										newInputType,
										{ options: [] },
									);
								} else {
									props.setInputType(
										props.inputToken.index,
										newInputType,
										null,
									);
								}
							}}
						>
							<SelectTrigger
								id={`input-type-select-${props.inputToken.index}`}
								className="w-full"
								style={{
									height: "54px",
									fontSize: "15px",
									borderColor: inputTypeOpen
										? "#16a34a"
										: undefined,
									boxShadow: inputTypeOpen
										? "0 0 0 1px #16a34a"
										: undefined,
								}}
							>
								<SelectValue placeholder="" />
							</SelectTrigger>
							<SelectContent>
								{INPUT_TYPES.map((type) => (
									<SelectItem key={type} value={type}>
										{INPUT_TYPE_DISPLAY[type]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{showMetaAutocomplete && (
						<div className="flex flex-row items-center gap-2">
							{props.inputType === INPUT_TYPE_SELECT ? (
								<div className="flex-1" style={{ position: "relative" }}>
									<label
										htmlFor="select-options-input"
										style={
											optionsFocused || optionsHasValue
												? {
														...floatingLabelFloated,
														color: optionsFocused
															? "#16a34a"
															: "#6b7280",
													}
												: floatingLabelResting
										}
									>
										{getMetaSelectorLabel()}
									</label>
									<Input
										id="select-options-input"
										placeholder={optionsFocused ? "Enter options (comma separated)" : ""}
										value={newOption}
										onFocus={() => setOptionsFocused(true)}
										onBlur={() => {
											setOptionsFocused(false);
											if (newOption.trim()) {
												parseAndAddOptions(newOption);
											}
										}}
										onChange={(e) =>
											setNewOption(e.target.value)
										}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												parseAndAddOptions(newOption);
											}
										}}
										style={{
											height: "54px",
											fontSize: "15px",
											borderColor: optionsFocused
												? "#16a34a"
												: undefined,
											boxShadow: optionsFocused
												? "0 0 0 1px #16a34a"
												: undefined,
										}}
									/>
								</div>
							) : (
								<div className="flex-1" style={{ position: "relative" }}>
									<label
										htmlFor="meta-select"
										style={
											metaOpen || metaHasValue
												? {
														...floatingLabelFloated,
														color: metaOpen
															? "#16a34a"
															: "#6b7280",
													}
												: floatingLabelResting
										}
									>
										{getMetaSelectorLabel()}
									</label>
									<Select
										open={metaOpen}
										onOpenChange={setMetaOpen}
										value={
											(props.inputTypeMeta as string) ??
											""
										}
										onValueChange={(
											newMetaValue: string,
										) => {
											props.setInputType(
												props.inputToken.index,
												props.inputType,
												newMetaValue,
											);
										}}
									>
										<SelectTrigger
											id="meta-select"
											className="w-full"
											style={{
												height: "54px",
												fontSize: "15px",
												borderColor: metaOpen
													? "#16a34a"
													: undefined,
												boxShadow: metaOpen
													? "0 0 0 1px #16a34a"
													: undefined,
											}}
										>
											<SelectValue placeholder="" />
										</SelectTrigger>
										<SelectContent>
											{getMetaSelectorOptions().map(
												(option) => (
													<SelectItem
														key={option}
														value={option}
													>
														{getMetaSelectorDisplay(
															option,
														)}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</div>
							)}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="mt-5 h-4 w-4 cursor-pointer text-gray-400" />
									</TooltipTrigger>
									<TooltipContent>
										<p className="text-sm">
											{
												INPUT_TYPE_HELP_TEXT[
													props.inputType
												]
											}
										</p>
										{props.inputType ===
											INPUT_TYPE_SELECT &&
											selectOptions.length > 0 && (
												<>
													<p className="mt-2 text-sm font-bold">
														Current options:
													</p>
													<p className="text-sm">
														{selectOptions.join(
															", ",
														)}
													</p>
												</>
											)}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
