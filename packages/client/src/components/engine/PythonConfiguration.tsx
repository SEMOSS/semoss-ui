import { Stack, styled, TextArea, TextField, Typography } from "@semoss/ui";
import type { PythonConfigValues } from "./engine.types";

interface PythonConfigurationProps {
	value: PythonConfigValues;
	onChange: (newValues: PythonConfigValues) => void;
}

const StyledDiv = styled("div")({
	display: "flex",
	width: "100%",
	gap: "25px",
});

const StyledHeading = styled(Typography)({
	fontSize: "24px",
	color: "#212121",
});

const StyledFormContainer = styled("div")({
	width: "100%",
	marginTop: "5px",
});

const StyledFormDiv = styled("div")({
	marginBottom: "20px",
});

const StyledFormBottomDiv = styled("div")({});

const StyledTextArea = styled(TextArea)({
	borderRadius: "8px",
});

export const PythonConfiguration = ({
	value,
	onChange,
}: PythonConfigurationProps) => {
	const handleChange = (field: keyof PythonConfigValues, val: string) => {
		onChange({ ...value, [field]: val });
	};
	return (
		<form>
			<StyledDiv>
				<Stack>
					<StyledHeading variant="h5">General</StyledHeading>
					<Typography variant="body1" color={"secondary"}>
						Please provide the name, type, and model to uniquely
						identify, categorize, and configure your setup for
						optimal performance.
					</Typography>
				</Stack>
				<StyledDiv>
					<StyledFormContainer>
						<StyledFormDiv>
							<TextField
								size="small"
								fullWidth
								placeholder="Function Type *"
								value={value.FUNCTION_TYPE}
								disabled={true}
								onChange={(e) =>
									handleChange(
										"FUNCTION_TYPE",
										e.target.value,
									)
								}
							/>
						</StyledFormDiv>
						<StyledFormDiv>
							<TextField
								size="small"
								fullWidth
								placeholder="Function Name *"
                required = {true}
								value={value.NAME}
								onChange={(e) =>
									handleChange("NAME", e.target.value)
								}
							/>
						</StyledFormDiv>
						<StyledFormDiv>
							<TextField
								size="small"
								fullWidth
								placeholder="Function Parameters"
								value={value.FUNCTION_PARAMETERS}
								onChange={(e) =>
									handleChange(
										"FUNCTION_PARAMETERS",
										e.target.value,
									)
								}
							/>
						</StyledFormDiv>
						<StyledFormDiv>
							<TextField
								size="small"
								fullWidth
								placeholder="Function Required Parameters"
								value={value.FUNCTION_REQUIRED_PARAMETERS}
								onChange={(e) =>
									handleChange(
										"FUNCTION_REQUIRED_PARAMETERS",
										e.target.value,
									)
								}
							/>
						</StyledFormDiv>
            <StyledFormDiv>
							<StyledTextArea
								fullWidth
								placeholder="Function Required Parameters Description "
                required = {true}
								minRows={4}
								maxRows={10}
								value={value.FUNCTION_REQUIRED_PARAMETERS_DESCRIPTION}
								onChange={(e) =>
									handleChange(
										"FUNCTION_REQUIRED_PARAMETERS_DESCRIPTION",
										e.target.value,
									)
								}
							/>
						</StyledFormDiv>
						<StyledFormDiv>
							<StyledTextArea
								fullWidth
								placeholder="Description *"
                required = {true}
								minRows={4}
								maxRows={10}
								value={value.FUNCTION_DESCRIPTION}
								onChange={(e) =>
									handleChange(
										"FUNCTION_DESCRIPTION",
										e.target.value,
									)
								}
							/>
						</StyledFormDiv>
						<StyledFormDiv>
							<TextField
								size="small"
								fullWidth
								placeholder="Python File Name"
								value={value.PYTHON_FILE_NAME}
								onChange={(e) =>
									handleChange(
										"PYTHON_FILE_NAME",
										e.target.value,
									)
								}
							/>
						</StyledFormDiv>
						<StyledFormBottomDiv>
							<StyledTextArea
								fullWidth
								placeholder="Content"
								minRows={4}
								maxRows={10}
								value={value.CONTENT}
								onChange={(e) =>
									handleChange("CONTENT", e.target.value)
								}
							/>
						</StyledFormBottomDiv>
					</StyledFormContainer>
				</StyledDiv>
			</StyledDiv>
		</form>
	);
};
