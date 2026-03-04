import { InfoOutlined } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import {
	Autocomplete,
	Fade,
	Grid,
	Stack,
	styled,
	TextField,
	Tooltip,
	Typography,
} from "@semoss/ui";
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

const HelpTextIcon = styled(InfoOutlined)(({ theme }) => ({
	color: theme.palette.grey[400],
	cursor: "pointer",
}));

export const PromptBuilderInputTypeSelection = (props: {
	inputToken: Token;
	inputType: string | null;
	inputTypeMeta: any;
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
		inputTypeMeta: any,
	) => void;
}) => {
	const [selectOptions, setSelectOptions] = useState<string[]>([]);
	const [newOption, setNewOption] = useState<string>("");

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
				return value; // For select options, display the value as-is
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
			// Handle comma-separated values
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
		<Grid
			sx={{
				justifyContent: "space-between",
				alignItems: "start",
			}}
			container
		>
			<Grid item>
				<PromptReadonlyInputToken tokenKey={props.inputToken.key} />
			</Grid>
			<Grid item xs={9} md={6}>
				<Stack spacing={2}>
					<Autocomplete
						fullWidth
						disableClearable
						multiple={false}
						id={"input-token-autocomplete"}
						options={INPUT_TYPES}
						value={props.inputType}
						getOptionLabel={(option) => INPUT_TYPE_DISPLAY[option]}
						onChange={(_, newInputType: string) => {
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
						renderInput={(params) => (
							<TextField
								{...params}
								label="Input Type"
								variant="outlined"
							/>
						)}
					/>
					<Fade in={showMetaAutocomplete}>
						<span>
							<Stack direction="row" alignItems="center">
								<Autocomplete
									fullWidth
									disableClearable
									size="small"
									id={"meta-autocomplete"}
									multiple={false}
									loading={getMetaSelectorLoading()}
									options={getMetaSelectorOptions()}
									value={
										props.inputType === INPUT_TYPE_SELECT
											? ""
											: (props.inputTypeMeta ?? "")
									}
									getOptionLabel={getMetaSelectorDisplay}
									freeSolo={
										props.inputType === INPUT_TYPE_SELECT
									}
									onChange={(_, newMetaValue: string) => {
										if (
											props.inputType ===
											INPUT_TYPE_SELECT
										) {
											// For select type, don't auto-process - let user control when to add options
											setNewOption(newMetaValue || "");
										} else {
											props.setInputType(
												props.inputToken.index,
												props.inputType,
												newMetaValue,
											);
										}
									}}
									onInputChange={(
										_,
										newInputValue: string,
										reason,
									) => {
										if (
											props.inputType ===
											INPUT_TYPE_SELECT
										) {
											if (reason === "input") {
												setNewOption(newInputValue);
											}
										}
									}}
									renderInput={(params) => (
										<TextField
											{...params}
											label={getMetaSelectorLabel()}
											variant="outlined"
											placeholder={
												props.inputType ===
												INPUT_TYPE_SELECT
													? "Enter options (comma separated)"
													: undefined
											}
											value={
												props.inputType ===
												INPUT_TYPE_SELECT
													? newOption
													: params.inputProps?.value
											}
											onChange={
												props.inputType ===
												INPUT_TYPE_SELECT
													? (e) => {
															const value =
																e.target.value;
															setNewOption(value);
														}
													: params.inputProps
															?.onChange
											}
											onKeyDown={
												props.inputType ===
												INPUT_TYPE_SELECT
													? (e) => {
															if (
																e.key ===
																"Enter"
															) {
																e.preventDefault();
																parseAndAddOptions(
																	newOption,
																);
															}
														}
													: undefined
											}
											onBlur={
												props.inputType ===
												INPUT_TYPE_SELECT
													? (e) => {
															if (
																newOption.trim()
															) {
																parseAndAddOptions(
																	newOption,
																);
															}
														}
													: undefined
											}
										/>
									)}
								/>
								<Tooltip
									title={
										<React.Fragment>
											<Typography variant="body2">
												{
													INPUT_TYPE_HELP_TEXT[
														props.inputType
													]
												}
											</Typography>
											{props.inputType ===
												INPUT_TYPE_SELECT &&
												selectOptions.length > 0 && (
													<>
														<Typography
															variant="body2"
															sx={{
																mt: 1,
																fontWeight:
																	"bold",
															}}
														>
															Current options:
														</Typography>
														<Typography variant="body2">
															{selectOptions.join(
																", ",
															)}
														</Typography>
													</>
												)}
										</React.Fragment>
									}
									arrow
								>
									<HelpTextIcon fontSize="small" />
								</Tooltip>
							</Stack>
						</span>
					</Fade>
				</Stack>
			</Grid>
		</Grid>
	);
};
