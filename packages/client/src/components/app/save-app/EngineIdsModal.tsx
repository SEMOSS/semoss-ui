/**
 * EngineIdsModal Component
 * 
 * A modal component for displaying engine ID discovery results when saving an app.
 * Allows users to:
 * - View successfully discovered engines
 * - Handle failed engine discoveries with replacement options
 * - Manage engine replacements for inaccessible engines
 * - Select engines for batch operations
 * 
 * @component
 * @param {boolean} open - Controls modal visibility
 * @param {string[]} successIds - Array of successfully discovered engine IDs
 * @param {string[]} failedIds - Array of failed engine IDs
 * @param {Function} onClose - Callback for closing the modal
 * @param {Function} onEngineReplacement - Optional callback for handling engine replacements
 * @param {string} appId - The application ID
 * @param {boolean} isUploadProjectApp - Whether this is an upload project app
 * @param {Record} engineInfo - Detailed information about engines including files and instances
 * @param {Record} discoveryResults - Results from engine discovery process
 */

import Close from "@mui/icons-material/Close";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Button,
	FormControl,
	IconButton,
	MenuItem,
	Modal,
	Select,
	Stack,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import { usePixel, useRootStore } from "@/hooks";
import type { engine } from "../app-details.utility";

interface EngineIdsModalProps {
	open: boolean;
	successIds: string[];
	failedIds: string[];
	onClose: () => void;
	onEngineReplacement?: (replacements: Record<string, string>) => void;
	appId: string;
	isUploadProjectApp: boolean;
	engineInfo: Record<
		string,
		{ name: string; files: string[]; instances: (string | number)[] }
	>;
}

const StyledModal = styled(Modal)({
	"& .MuiDialog-paper": {
		width: "95vw",
		maxWidth: 1000,
		minWidth: 320,
		minHeight: "70vh",
	},
});

const StyledTitleStack = styled(Stack)(({ theme }) => ({
	padding: theme.spacing(1),
}));

const StyledCenterTitle = styled(Typography)({
	flex: 1,
	fontWeight: 600,
});

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
	padding: theme.spacing(3),
}));

const StyledMainStack = styled(Stack)({
	width: "100%",
});

const StyledSubTitle = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	marginTop: theme.spacing(-1),
}));

const StyledSectionStack = styled(Stack)({
	width: "100%",
});

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
	color: theme.palette.success.main,
	fontWeight: 600,
}));

const StyledSectionCount = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontWeight: 500,
}));

const StyledEngineListStack = styled(Stack)(({ theme }) => ({
	paddingLeft: theme.spacing(1),
	width: "100%",
}));

const StyledEngineItem = styled(Stack)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	padding: theme.spacing(1.5),
	borderRadius: theme.spacing(1),
	border: `1px solid ${theme.palette.divider}`,
}));

const StyledEngineNumber = styled(Typography)(({ theme }) => ({
	backgroundColor: theme.palette.grey[100],
	color: theme.palette.text.secondary,
	paddingLeft: theme.spacing(1.5),
	paddingRight: theme.spacing(1.5),
	paddingTop: theme.spacing(0.5),
	paddingBottom: theme.spacing(0.5),
	borderRadius: theme.spacing(1),
	minWidth: 24,
	textAlign: "center",
	fontWeight: 500,
	fontSize: "0.875rem",
}));

const StyledEngineId = styled(Typography)({
	wordBreak: "break-all",
	fontFamily: "monospace",
	color: "inherit",
});

const StyledEngineName = styled("span")(({ theme }) => ({
	color: theme.palette.primary.main,
	fontWeight: 500,
	marginLeft: 12,
}));

const StyledFileStack = styled(Stack)(({ theme }) => ({
	marginTop: theme.spacing(0.5),
}));

const StyledFileTag = styled(Typography)(({ theme }) => ({
	backgroundColor: theme.palette.grey[100],
	color: theme.palette.text.secondary,
	paddingLeft: theme.spacing(1),
	paddingRight: theme.spacing(1),
	paddingTop: theme.spacing(0.5),
	paddingBottom: theme.spacing(0.5),
	borderRadius: theme.spacing(1),
	fontSize: "0.8rem",
	fontWeight: 500,
}));

const StyledInstanceTag = styled(Typography)(({ theme }) => ({
	backgroundColor: theme.palette.grey[200],
	color: theme.palette.primary.main,
	paddingLeft: theme.spacing(1),
	paddingRight: theme.spacing(1),
	paddingTop: theme.spacing(0.5),
	paddingBottom: theme.spacing(0.5),
	borderRadius: theme.spacing(1),
	fontSize: "0.8rem",
	fontWeight: 500,
}));

const StyledEmptyMessage = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontStyle: "italic",
	textAlign: "center",
	paddingTop: theme.spacing(2),
	paddingBottom: theme.spacing(2),
}));

const StyledFailedSectionTitle = styled(Typography)(({ theme }) => ({
	color: theme.palette.error.main,
	fontWeight: 600,
}));

const StyledSelectStack = styled(Stack)(({ theme }) => ({
	paddingLeft: theme.spacing(1),
	width: "100%",
}));

const StyledEngineSelectItem = styled(Stack)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	padding: theme.spacing(1.5),
	borderRadius: theme.spacing(1),
	border: `1px solid ${theme.palette.divider}`,
}));

const StyledSelectFormControl = styled(FormControl)({
	minWidth: 200,
});


const StyledEngineInfoStack = styled(Stack)({
	flex: "1 1 auto",
	minWidth: 0,
});

const StyledEngineIdText = styled(Typography)({
	wordBreak: "break-all",
	fontFamily: "monospace",
	paddingLeft: 12,
	paddingRight: 12,
	paddingTop: 4,
	paddingBottom: 4,
	borderRadius: 4,
	fontSize: "0.8rem",
	overflow: "hidden",
	textOverflow: "ellipsis",
});

const StyledSelectContainer = styled(Stack)({
	flex: "0 0 400px",
});

const StyledLoadingContainer = styled(Stack)(({ theme }) => ({
	padding: theme.spacing(2),
	backgroundColor: theme.palette.background.paper,
	borderRadius: theme.spacing(2),
	border: `1px solid ${theme.palette.divider}`,
}));

const StyledLoadingText = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledErrorContainer = styled(Stack)(({ theme }) => ({
	padding: theme.spacing(2),
	backgroundColor: theme.palette.warning.light,
	borderRadius: theme.spacing(2),
	border: `1px solid ${theme.palette.warning.main}`,
}));


const StyledErrorTitle = styled(Typography)(({ theme }) => ({
	color: theme.palette.warning.dark,
	fontWeight: 500,
}));

const StyledErrorCaption = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledActionsStack = styled(Stack)(({ theme }) => ({
	width: "100%",
	padding: theme.spacing(2),
}));

const StyledSaveButton = styled(Button)({
	minWidth: 150,
	paddingTop: 12,
	paddingBottom: 12,
});

const StyledCancelButton = styled(Button)({
	minWidth: 100,
	paddingTop: 12,
	paddingBottom: 12,
});

const StyledConfirmationModal = styled(Modal)({
	"& .MuiDialog-paper": {
		width: "80vw",
		maxWidth: 1000,
		minWidth: 320,
	},
});

const StyledConfirmationContent = styled(Modal.Content)(({ theme }) => ({
	padding: theme.spacing(3),
}));

const StyledConfirmationText = styled(Typography)(({ theme }) => ({
	marginBottom: theme.spacing(2),
	color: "#555",
}));

const StyledReplacementStack = styled(Stack)(({ theme }) => ({
	paddingLeft: theme.spacing(1),
	width: "100%",
}));

const StyledReplacementItem = styled(Stack)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	padding: theme.spacing(1.5),
	borderRadius: theme.spacing(1),
	border: `1px solid ${theme.palette.divider}`,
}));

const StyledFromText = styled(Typography)({
	wordBreak: "break-all",
	fontFamily: "monospace",
	fontWeight: 500,
});

const StyledToText = styled(Typography)(({ theme }) => ({
	wordBreak: "break-all",
	fontFamily: "monospace",
	color: theme.palette.success.main,
	fontWeight: 500,
}));

const StyledArrowText = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontWeight: "bold",
}));

/**
 * Modal component for displaying and managing engine ID discovery results
 * Allows users to view accessible engines and replace inaccessible ones
 */
const EngineIdsModal: React.FC<EngineIdsModalProps> = ({
	open,
	successIds,
	failedIds,
	onClose,
	onEngineReplacement,
	appId,
	isUploadProjectApp: _isUploadProjectApp,
	engineInfo,
}) => {

	// STATE MANAGEMENT
	const [engineReplacements, setEngineReplacements] = useState<
		Record<string, string>
	>({});
	const notification = useNotification();
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [replacementsToShow, setReplacementsToShow] = useState<
		Record<string, string>
	>({});
	const { monolithStore } = useRootStore();
	const [showDiscovery, setShowDiscovery] = useState(open);
	const [replacementDetails, setReplacementDetails] = useState<
		Record<
			string,
			{ replacement: string; files: string[]; engineName: string }
		>
	>({});

	// Fetch available engines that user has access to
	const availableEngines = usePixel<engine[]>("MyEngines();");

	//	Initialize replacement state when modal opens
	useEffect(() => {
		if (open && failedIds.length > 0) {
			const initialReplacements: Record<string, string> = {};
			failedIds.forEach((id) => {
				initialReplacements[id] = "";
			});
			setEngineReplacements(initialReplacements);
		}
	}, [open, failedIds]);

	//	Sync modal visibility state
	useEffect(() => {
		setShowDiscovery(open);
	}, [open]);

	//	Handle engine replacement selection

	const handleEngineReplacementChange = (
		failedEngineId: string,
		replacementEngineId: string,
	) => {
		setEngineReplacements((prev) => ({
			...prev,
			[failedEngineId]: replacementEngineId,
		}));
	};

	//	Save engine replacements and show confirmation
	const handleSaveReplacements = async () => {
		// Only include replacements that have been selected
		const validReplacements = Object.entries(engineReplacements)
			.filter(([, replacement]) => replacement !== "")
			.reduce(
				(acc, [failed, replacement]) => {
					acc[failed] = replacement;
					return acc;
				},
				{} as Record<string, string>,
			);

		// Format map as required
		const mapStr = JSON.stringify([validReplacements]);
		const response = await monolithStore.runQuery(
			`ReplaceInaccessibleEngines(project=["${appId}"], map=${mapStr});`,
		);

		const pixel = response?.pixelReturn?.[0];
		const output = pixel?.output;
		const operationType = pixel?.operationType || [];
		const successObj = output?.success ?? {};
		const failedObj = output?.failed ?? {};
		const errorObj = output?.error ?? null;
		const successKeys = Object.keys(successObj);
		const failedKeys = Object.keys(failedObj);

		// Error if operationType includes 'ERROR' or output is a string (not object), or errorObj exists
		if (
			(Array.isArray(operationType) && operationType.includes("ERROR")) ||
			typeof output === "string" ||
			errorObj
		) {
			let errorMsg = "Failed to replace inaccessible engines.";
			if (typeof output === "string") {
				errorMsg = output;
			} else if (typeof errorObj === "string") {
				errorMsg = errorObj;
			}
			notification.add({
				color: "error",
				message: errorMsg,
			});
			return;
		}

		if (successKeys.length > 0) {
			const details: Record<
				string,
				{ replacement: string; files: string[]; engineName: string }
			> = {};
			successKeys.forEach((SuccessId) => {
				details[SuccessId] = {
					replacement: validReplacements[SuccessId],
					files: successObj[SuccessId]?.files || [],
					engineName: successObj[SuccessId]?.engineName || "",
				};
			});
			setReplacementDetails(details);
			setReplacementsToShow(validReplacements);
			setShowDiscovery(false);
			setShowConfirmation(true);

			// Show notification for any failed engine replacements
			if (
				failedObj &&
				typeof failedObj === "object" &&
				failedKeys.length > 0
			) {
				failedKeys.forEach((failedId) => {
					const engineName = failedObj[failedId]?.engineName || "";
					notification.add({
						color: "error",
						message: `"${failedId}" engine replacement${engineName ? ` (${engineName})` : ""} failed`,
					});
				});
			}
		} else {
			if (onEngineReplacement) {
				onEngineReplacement(validReplacements);
			}
			onClose();
		}
	};

	//	Handle confirmation modal close

	const handleConfirmationClose = () => {
		setShowConfirmation(false);
		if (onEngineReplacement) {
			onEngineReplacement(replacementsToShow);
		}
		setShowDiscovery(false);
		onClose();
	};

//	Check if there are valid replacements selected

	const hasValidReplacements =
		failedIds.length > 0 &&
		failedIds.some(
			(id) => engineReplacements[id] && engineReplacements[id] !== "",
		);


	return (
		<>
			<StyledModal open={showDiscovery} maxWidth={false}>
				<Modal.Title>
					<StyledTitleStack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<StyledCenterTitle variant="h6" align="center">
							Engine IDs Discovery
						</StyledCenterTitle>
						<IconButton aria-label="close" onClick={onClose}>
							<Close />
						</IconButton>
					</StyledTitleStack>
				</Modal.Title>
				<StyledModalContent>
					<StyledMainStack spacing={3}>
						<StyledSubTitle variant="h6" align="center">
							The following engine IDs were detected in your
							application:
						</StyledSubTitle>
						<StyledSectionStack spacing={1.5}>
							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
							>
								<StyledSectionTitle variant="h6">
									Accessible Engines
								</StyledSectionTitle>
								<StyledSectionCount variant="body2">
									({successIds.length})
								</StyledSectionCount>
							</Stack>
							<StyledEngineListStack spacing={1}>
								{successIds.length > 0 ? (
									successIds.map((id, index) => (
										<StyledEngineItem
											key={id}
											direction="row"
											alignItems="center"
											spacing={2}
										>
											<StyledEngineNumber variant="body2">
												{index + 1}
											</StyledEngineNumber>
											<StyledEngineId variant="body2">
												{id}
												{engineInfo?.[id] && (
													<StyledEngineName>
														({engineInfo[id].name})
													</StyledEngineName>
												)}
											</StyledEngineId>
											{engineInfo?.[id]?.files?.length >
												0 && (
												<StyledFileStack
													direction="row"
													spacing={2}
												>
													{engineInfo[id].files.map(
														(file, idx) => (
															<Stack
																key={`success-${id}-${file}`}
																direction="row"
																spacing={1}
																alignItems="center"
															>
																<StyledFileTag variant="caption">
																	{file}
																</StyledFileTag>
																{engineInfo[id]
																	.instances?.[
																	idx
																] !==
																	undefined && (
																	<StyledInstanceTag variant="caption">
																		{
																			engineInfo[
																				id
																			]
																				.instances[
																				idx
																			]
																		}
																	</StyledInstanceTag>
																)}
															</Stack>
														),
													)}
												</StyledFileStack>
											)}
										</StyledEngineItem>
									))
								) : (
									<StyledEmptyMessage variant="body2">
										No accessible engine IDs found.
									</StyledEmptyMessage>
								)}
							</StyledEngineListStack>
						</StyledSectionStack>

						{/* Inaccessible Engines Section */}
						<StyledSectionStack spacing={1.5}>
							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
							>
								<StyledFailedSectionTitle variant="h6">
									Inaccessible Engines
								</StyledFailedSectionTitle>
								<StyledSectionCount variant="body2">
									({failedIds.length})
								</StyledSectionCount>
							</Stack>

							{/* Engine Selection List */}
							<StyledSelectStack spacing={1.5}>
								{failedIds.length > 0 ? (
									failedIds.map((id, index) => (
										<StyledEngineSelectItem
											key={id}
											direction="row"
											alignItems="center"
											spacing={3}
										>
											<StyledEngineInfoStack
												direction="row"
												alignItems="center"
												spacing={1.5}
											>
												<StyledEngineNumber variant="body2">
													{index + 1}
												</StyledEngineNumber>
												<StyledEngineIdText variant="body2">
													{id}
												</StyledEngineIdText>
												{engineInfo?.[id]?.files
													?.length > 0 && (
													<StyledFileStack
														direction="row"
														spacing={2}
													>
														{engineInfo[
															id
														].files.map(
															(file, idx) => (
																<Stack
																	key={`failed-${id}-${file}`}
																	direction="row"
																	spacing={1}
																	alignItems="center"
																>
																	<StyledFileTag variant="caption">
																		{file}
																	</StyledFileTag>
																	{engineInfo[
																		id
																	]
																		.instances?.[
																		idx
																	] !==
																		undefined && (
																		<StyledInstanceTag variant="caption">
																			{
																				engineInfo[
																					id
																				]
																					.instances[
																					idx
																				]
																			}
																		</StyledInstanceTag>
																	)}
																</Stack>
															),
														)}
													</StyledFileStack>
												)}
											</StyledEngineInfoStack>
											<StyledSelectContainer>
												<StyledSelectFormControl
													fullWidth
													size="small"
												>
													<Select
														value={
															engineReplacements[
																id
															] || ""
														}
														onChange={(e) =>
															handleEngineReplacementChange(
																id,
																e.target
																	.value as string,
															)
														}
														sx={{
															"& .MuiSelect-select":
																{
																	py: 1,
																	fontSize:
																		"0.875rem",
																},
														}}
													>
														{availableEngines.data?.map(
															(engine) => (
																<MenuItem
																	key={
																		engine.database_id ||
																		engine.app_id
																	}
																	value={
																		engine.database_id ||
																		engine.app_id
																	}
																	sx={{
																		fontSize:
																			"0.875rem",
																	}}
																>
																	{engine.database_name ||
																		engine.app_name}{" "}
																	<span
																		style={{
																			color: "#666",
																			fontSize:
																				"0.8rem",
																		}}
																	>
																		(
																		{engine.database_type ||
																			engine.app_type}
																		)
																	</span>
																</MenuItem>
															),
														)}
													</Select>
													{!engineReplacements[
														id
													] && (
														<span
															style={{
																position:
																	"absolute",
																left: 16,
																top: 8,
																color: "#999",
																fontStyle:
																	"italic",
																pointerEvents:
																	"none",
																fontSize:
																	"0.875rem",
															}}
														>
															Select replacement
															engine
														</span>
													)}
												</StyledSelectFormControl>
											</StyledSelectContainer>
										</StyledEngineSelectItem>
									))
								) : (
									<StyledEmptyMessage variant="body2">
										No inaccessible engine IDs found.
									</StyledEmptyMessage>
								)}
							</StyledSelectStack>
						</StyledSectionStack>

						{/* Loading state for engines */}
						{availableEngines.status === "LOADING" && (
							<StyledLoadingContainer
								spacing={1}
								alignItems="center"
							>
								<StyledLoadingText variant="body2">
									Loading available engines...
								</StyledLoadingText>
							</StyledLoadingContainer>
						)}

						{/* Error state for engines */}
						{availableEngines.status === "ERROR" && (
							<StyledErrorContainer spacing={1}>
								<StyledErrorTitle variant="body2">
									Error loading available engines
								</StyledErrorTitle>
								<StyledErrorCaption variant="caption">
									You may not have access to any engines or
									there was a connection issue.
								</StyledErrorCaption>
							</StyledErrorContainer>
						)}
					</StyledMainStack>
				</StyledModalContent>
				<Modal.Actions>
					<StyledActionsStack
						direction="row"
						justifyContent="center"
						spacing={2}
					>
						{failedIds.length > 0 && (
							<StyledSaveButton
								variant="contained"
								color="primary"
								onClick={handleSaveReplacements}
								disabled={!hasValidReplacements}
							>
								Save Replacements
							</StyledSaveButton>
						)}
						<StyledCancelButton
							variant="outlined"
							onClick={onClose}
						>
							{failedIds.length > 0 ? "Cancel" : "OK"}
						</StyledCancelButton>
					</StyledActionsStack>
				</Modal.Actions>
			</StyledModal>
			<StyledConfirmationModal
				open={showConfirmation}
				fullWidth
				maxWidth={false}
			>
				<Modal.Title>
					<StyledCenterTitle
						variant="h6"
						align="center"
					>
						Engine Replacement Confirmation
					</StyledCenterTitle>
				</Modal.Title>
				<StyledConfirmationContent>
					<StyledConfirmationText variant="body1">
						The following engine IDs have been replaced:
					</StyledConfirmationText>
					<StyledReplacementStack spacing={1.5}>
						{Object.entries(replacementDetails).map(
							([failed, detail], index) => (
								<StyledReplacementItem
									key={failed}
									direction="row"
									alignItems="center"
									spacing={3}
								>
									<StyledEngineInfoStack
										direction="row"
										alignItems="center"
										spacing={1.5}
									>
										<StyledEngineNumber variant="body2">
											{index + 1}
										</StyledEngineNumber>
										<StyledFromText variant="body2">
											{failed}
										</StyledFromText>
										<StyledArrowText variant="body2">
											&rarr;
										</StyledArrowText>
										<StyledToText variant="body2">
											{detail.replacement}
										</StyledToText>
										<StyledEngineName>
											( {detail.engineName} )
										</StyledEngineName>
										{detail.files &&
											detail.files.length > 0 && (
												<StyledFileStack
													direction="row"
													spacing={1}
												>
													{detail.files.map(
														(file) => (
															<StyledFileTag
																key={file}
																variant="caption"
															>
																{file}
															</StyledFileTag>
														),
													)}
												</StyledFileStack>
											)}
									</StyledEngineInfoStack>
								</StyledReplacementItem>
							),
						)}
					</StyledReplacementStack>
				</StyledConfirmationContent>
				<Modal.Actions>
					<StyledActionsStack
						direction="row"
						justifyContent="center"
					>
						<StyledSaveButton
							variant="contained"
							color="primary"
							onClick={handleConfirmationClose}
						>
							OK
						</StyledSaveButton>
					</StyledActionsStack>
				</Modal.Actions>
			</StyledConfirmationModal>
		</>
	);
};

export default EngineIdsModal;
