import { lazy, Suspense, useEffect, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Box,
	Button,
	Paper,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	updateDatabaseSmssProperties,
	updateProjectSmssProperties,
} from "@/api";
import { useSettings } from "@/hooks";
import type { ALL_TYPES } from "@/types";

const Editor = lazy(() => import("@monaco-editor/react"));

interface UpdateSMSSProps {
	/**
	 * Type of setting
	 */
	type: ALL_TYPES;

	/**
	 * Id of the setting
	 */
	id: string;
}

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	width: "100%",
	gap: theme.spacing(3),
}));

const StyledTopDiv = styled("div")(() => ({
	width: "100%",
	display: "flex",
	justifyContent: "space-between",
}));

const StyledPaper = styled(Paper)(() => ({
	height: "360px",
	paddingTop: "1rem",
}));

export const UpdateSMSS = (props: UpdateSMSSProps) => {
	const { type, id } = props;

	const notification = useNotification();
	const { adminMode } = useSettings();

	const [initialValue, setInitialValue] = useState("");
	const [value, setValue] = useState("");
	const [readOnly, setReadOnly] = useState(true);

	const smssDetails = usePixel<string>(
		type === "DATABASE" ||
			type === "STORAGE" ||
			type === "MODEL" ||
			type === "VECTOR" ||
			type === "FUNCTION"
			? adminMode
				? `AdminGetEngineSMSS(engine=['${id}'])`
				: `GetEngineSMSS(engine=['${id}'])`
			: type === "PROJECT"
				? adminMode
					? `AdminGetProjectSMSS(project=['${id}'])`
					: `GetProjectSMSS(project=['${id}'])`
				: "",
	);

	useEffect(() => {
		if (smssDetails.status !== "SUCCESS") {
			return;
		}

		setInitialValue(smssDetails.data);
		setValue(smssDetails.data);
	}, [smssDetails.status, smssDetails.data]);

	/**
	 * @name updateSMSSProperties
	 * @desc hit endpoint to update smss file
	 */
	const updateSMSSProperties = async () => {
		try {
			let response = null;
			if (type === "PROJECT") {
				response = await updateProjectSmssProperties(id, value);
			} else {
				response = await updateDatabaseSmssProperties(id, value);
			}

			if (!response) {
				throw Error("No Response from server");
			}

			if (response.data.success) {
				setReadOnly(true);
				setInitialValue(value);
				notification.add({
					color: "success",
					message: `Successfully updated SMSS Properties`,
				});
			} else {
				notification.add({
					color: "error",
					message: `Unable to update SMSS Properties for`,
				});
			}
		} catch (error) {
			notification.add({
				color: "error",
				message: ` ${error}: Unable to update SMSS Properties`,
			});
		}
	};

	return (
		<StyledContainer>
			<StyledTopDiv>
				<Typography variant={"h6"}>SMSS Properties</Typography>
				{readOnly ? (
					<Button
						variant="contained"
						size={"small"}
						onClick={() => setReadOnly(false)}
						data-test-id={`updateSMSS-editSNSS-btn`}
					>
						Edit SMSS
					</Button>
				) : (
					<Button
						variant={"contained"}
						size={"small"}
						disabled={initialValue === value}
						onClick={() => {
							updateSMSSProperties();
						}}
						data-test-id={`updateSMSS-updateSNSS-btn`}
					>
						Update SMSS
					</Button>
				)}
			</StyledTopDiv>
			<StyledPaper
				elevation={1}
				sx={{
					position: "relative",
					border: "1px solid #90caf9",
					borderRadius: "8px",
					paddingTop: readOnly ? "20px" : "50px",
					"& .monaco-editor": {
						outline: "none !important",
						border: "none !important",
						boxShadow: "none !important",
						borderRadius: "8px",
					},
					"& .monaco-editor .overflow-guard": {
						borderRadius: "8px",
					},
				}}
				data-test-id={`SMSS-editor-container`}
			>
				{!readOnly && (
					<Box
						sx={{
							width: "100%",
							position: "absolute",
							top: "0",
							left: "50%",
							right: "50%",
							transform: "translateX(-50%)",
							backgroundColor: "#e3f2fd",
							padding: "8px 12px",
							borderRadius: "8px 8px 0 0",
							textAlign: "center",
							fontSize: "14px",
							fontWeight: 600,
							color: "#1976d2",
							zIndex: 1,
						}}
						data-test-id={`SMSS-edit-mode-banner`}
					>
						Edit Mode
					</Box>
				)}
				<Suspense fallback={<>...</>}>
					<Editor
						defaultValue={""}
						options={{ readOnly: readOnly }}
						value={value}
						language={"plaintext"}
						onChange={(newValue) => {
							// Handle changes in the editor's content.
							setValue(newValue);
						}}
						data-test-id={`SMSS-editor`}
					/>
				</Suspense>
			</StyledPaper>
		</StyledContainer>
	);
};
