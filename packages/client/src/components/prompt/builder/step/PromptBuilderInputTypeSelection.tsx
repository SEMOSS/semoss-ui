import { InfoOutlined } from "@mui/icons-material";
import React from "react";
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
	inputTypeMeta: string | null;
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
		inputTypeMeta: string | null,
	) => void;
}) => {
	const showMetaAutocomplete =
		props.inputType === INPUT_TYPE_VECTOR ||
		props.inputType === INPUT_TYPE_DATABASE;

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
			default:
				return "";
		}
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
							props.setInputType(
								props.inputToken.index,
								newInputType,
								null,
							);
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
									value={props.inputTypeMeta ?? ""}
									getOptionLabel={getMetaSelectorDisplay}
									onChange={(_, newMetaValue: string) => {
										props.setInputType(
											props.inputToken.index,
											props.inputType,
											newMetaValue,
										);
									}}
									renderInput={(params) => (
										<TextField
											{...params}
											label={getMetaSelectorLabel()}
											variant="outlined"
										/>
									)}
								/>
								<Tooltip
									title={
											<Typography variant="body2">
												{
													INPUT_TYPE_HELP_TEXT[
														props.inputType
													]
												}
											</Typography>
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
