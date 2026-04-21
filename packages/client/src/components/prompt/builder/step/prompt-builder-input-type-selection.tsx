import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
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

export const PromptBuilderInputTypeSelection = (props: {
	inputToken: Token;
	inputType: string | null;
	inputTypeMeta: unknown;
	cfgLibraryVectorDbs: {
		loading: boolean;
		ids: Array<string>;
		display: object;
	};
	cfgLibraryDatabases: {
		loading: boolean;
		ids: Array<string>;
		display: object;
	};
	setInputType: (
		inputTokenIndex: number,
		inputType: string,
		inputTypeMeta: unknown,
	) => void;
}) => {
	const [selectOptions, setSelectOptions] = useState<string[]>([]);
	const [newOption, setNewOption] = useState<string>("");

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

	const showMetaSelector =
		props.inputType === INPUT_TYPE_VECTOR ||
		props.inputType === INPUT_TYPE_DATABASE ||
		props.inputType === INPUT_TYPE_SELECT;

	const getMetaSelectorLoading = (): boolean => {
		switch (props.inputType) {
			case INPUT_TYPE_VECTOR:
				return props.cfgLibraryVectorDbs.loading;
			case INPUT_TYPE_DATABASE:
				return props.cfgLibraryDatabases.loading;
			default:
				return false;
		}
	};

	const getMetaSelectorOptions = (): Array<string> => {
		switch (props.inputType) {
			case INPUT_TYPE_VECTOR:
				return props.cfgLibraryVectorDbs.ids;
			case INPUT_TYPE_DATABASE:
				return props.cfgLibraryDatabases.ids;
			case INPUT_TYPE_SELECT:
				return selectOptions;
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

	const removeOption = (option: string) => {
		const updatedOptions = selectOptions.filter((o) => o !== option);
		setSelectOptions(updatedOptions);
		props.setInputType(props.inputToken.index, props.inputType, {
			options: updatedOptions,
		});
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
				props.setInputType(props.inputToken.index, props.inputType, {
					options: updatedOptions,
				});
				return true;
			}
		}
		return false;
	};

	return (
		<div className="flex items-start justify-between gap-4">
			<div>
				<PromptReadonlyInputToken tokenKey={props.inputToken.key} />
			</div>
			<div className="flex w-1/2 flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<Label>Input Type</Label>
					<Select
						value={props.inputType ?? ""}
						onValueChange={(newInputType) => {
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
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select Input Type" />
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

				{showMetaSelector && (
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-1.5">
							<Label>{getMetaSelectorLabel()}</Label>
							{INPUT_TYPE_HELP_TEXT[props.inputType] && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3.5 w-3.5 cursor-pointer text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="max-w-xs">
										<p>
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
													<p className="mt-1 font-bold">
														Current options:
													</p>
													<p>
														{selectOptions.join(
															", ",
														)}
													</p>
												</>
											)}
									</TooltipContent>
								</Tooltip>
							)}
						</div>
						{props.inputType === INPUT_TYPE_SELECT ? (
							<>
								<Input
									placeholder="Type an option and press Enter to add"
									value={newOption}
									onChange={(e) =>
										setNewOption(e.target.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											parseAndAddOptions(newOption);
										}
									}}
								/>
								{selectOptions.length > 0 && (
									<div className="flex flex-wrap gap-1.5">
										{selectOptions.map((option) => (
											<span
												key={option}
												className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs"
											>
												{option}
												<button
													type="button"
													onClick={() =>
														removeOption(option)
													}
													className="ml-0.5 rounded-full hover:bg-primary/20"
												>
													<X className="h-3 w-3" />
												</button>
											</span>
										))}
									</div>
								)}
							</>
						) : (
							<Select
								value={(props.inputTypeMeta as string) ?? ""}
								onValueChange={(val) =>
									props.setInputType(
										props.inputToken.index,
										props.inputType,
										val,
									)
								}
								disabled={getMetaSelectorLoading()}
							>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={`Select ${getMetaSelectorLabel()}`}
									>
										{(props.inputTypeMeta as string)
											? getMetaSelectorDisplay(
													props.inputTypeMeta as string,
												) || props.inputTypeMeta
											: undefined}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{getMetaSelectorOptions().map((id) => (
										<SelectItem key={id} value={id}>
											<div className="flex flex-col gap-0.5">
												<span>
													{getMetaSelectorDisplay(id)}
												</span>
												<span className="text-muted-foreground text-xs">
													<span className="font-medium">
														id:
													</span>{" "}
													{id}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
