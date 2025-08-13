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
	Typography,
	useNotification,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";
import { replaceInaccessibleEngines, useMyEngines } from "@/pixel/projects";
import type {
	EngineIdsModalProps,
	ReplaceEnginesOutput,
} from "./save-app.types";

// No styled components needed - using sx props instead

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
	const availableEngines = useMyEngines();

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
		const response = await replaceInaccessibleEngines(
			monolithStore,
			appId,
			validReplacements,
		);

		const pixel = response?.pixelReturn?.[0];
		const output = pixel?.output as ReplaceEnginesOutput;
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
			<Modal
				open={showDiscovery}
				maxWidth={false}
				sx={{
					"& .MuiDialog-paper": {
						width: "95vw",
						maxWidth: 1000,
						minWidth: 320,
						maxHeight: "90vh",
					},
				}}
			>
				<Modal.Title>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
						sx={{ p: 1 }}
					>
						<Typography
							variant="h6"
							align="center"
							sx={{ flex: 1, fontWeight: 600 }}
						>
							Engine IDs Discovery
						</Typography>
						<IconButton aria-label="close" onClick={onClose}>
							<Close />
						</IconButton>
					</Stack>
				</Modal.Title>
				<Modal.Content sx={{ p: 3 }}>
					<Stack spacing={3} sx={{ width: "100%" }}>
						<Typography
							variant="h6"
							align="center"
							sx={{
								color: "text.secondary",
								mt: -1,
							}}
						>
							The following engine IDs were detected in your
							application:
						</Typography>
						<Stack spacing={1.5} sx={{ width: "100%" }}>
							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
							>
								<Typography
									variant="h6"
									sx={{
										color: "success.main",
										fontWeight: 600,
									}}
								>
									Accessible Engines
								</Typography>
								<Typography
									variant="body2"
									sx={{
										color: "text.secondary",
										fontWeight: 500,
									}}
								>
									({successIds.length})
								</Typography>
							</Stack>
							<Stack spacing={1} sx={{ pl: 1, width: "100%" }}>
								{successIds.length > 0 ? (
									successIds.map((id, index) => (
										<Stack
											key={id}
											direction="row"
											alignItems="center"
											spacing={2}
											sx={{
												backgroundColor:
													"background.paper",
												p: 1.5,
												borderRadius: 1,
												border: 1,
												borderColor: "divider",
											}}
										>
											<Typography
												variant="body2"
												sx={{
													backgroundColor: "grey.100",
													color: "text.secondary",
													px: 1.5,
													py: 0.5,
													borderRadius: 1,
													minWidth: 24,
													textAlign: "center",
													fontWeight: 500,
													fontSize: "0.875rem",
												}}
											>
												{index + 1}
											</Typography>
											<Typography
												variant="body2"
												sx={{
													wordBreak: "break-all",
													fontFamily: "monospace",
													color: "inherit",
												}}
											>
												{id}
												{engineInfo?.[id] && (
													<span
														style={{
															color: "#1976d2",
															fontWeight: 500,
															marginLeft: 12,
														}}
													>
														({engineInfo[id].name})
													</span>
												)}
											</Typography>
											{engineInfo?.[id]?.files?.length >
												0 && (
												<Stack
													direction="row"
													spacing={2}
													sx={{ mt: 0.5 }}
												>
													{engineInfo[id].files.map(
														(file, idx) => (
															<Stack
																key={`success-${id}-${file}`}
																direction="row"
																spacing={1}
																alignItems="center"
															>
																<Typography
																	variant="caption"
																	sx={{
																		backgroundColor:
																			"grey.100",
																		color: "text.secondary",
																		px: 1,
																		py: 0.5,
																		borderRadius: 1,
																		fontSize:
																			"0.8rem",
																		fontWeight: 500,
																	}}
																>
																	{file}
																</Typography>
																{engineInfo[id]
																	.instances?.[
																	idx
																] !==
																	undefined && (
																	<Typography
																		variant="caption"
																		sx={{
																			backgroundColor:
																				"grey.200",
																			color: "primary.main",
																			px: 1,
																			py: 0.5,
																			borderRadius: 1,
																			fontSize:
																				"0.8rem",
																			fontWeight: 500,
																		}}
																	>
																		{
																			engineInfo[
																				id
																			]
																				.instances[
																				idx
																			]
																		}
																	</Typography>
																)}
															</Stack>
														),
													)}
												</Stack>
											)}
										</Stack>
									))
								) : (
									<Typography
										variant="body2"
										sx={{
											color: "text.secondary",
											fontStyle: "italic",
											textAlign: "center",
											py: 2,
										}}
									>
										No accessible engine IDs found.
									</Typography>
								)}
							</Stack>
						</Stack>

						{/* Inaccessible Engines Section */}
						<Stack spacing={1.5} sx={{ width: "100%" }}>
							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
							>
								<Typography
									variant="h6"
									sx={{
										color: "error.main",
										fontWeight: 600,
									}}
								>
									Inaccessible Engines
								</Typography>
								<Typography
									variant="body2"
									sx={{
										color: "text.secondary",
										fontWeight: 500,
									}}
								>
									({failedIds.length})
								</Typography>
							</Stack>

							{/* Engine Selection List */}
							<Stack spacing={1.5} sx={{ pl: 1, width: "100%" }}>
								{failedIds.length > 0 ? (
									failedIds.map((id, index) => (
										<Stack
											key={id}
											direction="row"
											alignItems="center"
											spacing={3}
											sx={{
												backgroundColor:
													"background.paper",
												p: 1.5,
												borderRadius: 1,
												border: 1,
												borderColor: "divider",
											}}
										>
											<Stack
												direction="row"
												alignItems="center"
												spacing={1.5}
												sx={{
													flex: "1 1 auto",
													minWidth: 0,
												}}
											>
												<Typography
													variant="body2"
													sx={{
														backgroundColor:
															"grey.100",
														color: "text.secondary",
														px: 1.5,
														py: 0.5,
														borderRadius: 1,
														minWidth: 24,
														textAlign: "center",
														fontWeight: 500,
														fontSize: "0.875rem",
													}}
												>
													{index + 1}
												</Typography>
												<Typography
													variant="body2"
													sx={{
														wordBreak: "break-all",
														fontFamily: "monospace",
														px: 1.5,
														py: 0.5,
														borderRadius: 0.5,
														fontSize: "0.8rem",
														overflow: "hidden",
														textOverflow:
															"ellipsis",
													}}
												>
													{id}
												</Typography>
												{engineInfo?.[id]?.files
													?.length > 0 && (
													<Stack
														direction="row"
														spacing={2}
														sx={{ mt: 0.5 }}
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
																	<Typography
																		variant="caption"
																		sx={{
																			backgroundColor:
																				"grey.100",
																			color: "text.secondary",
																			px: 1,
																			py: 0.5,
																			borderRadius: 1,
																			fontSize:
																				"0.8rem",
																			fontWeight: 500,
																		}}
																	>
																		{file}
																	</Typography>
																	{engineInfo[
																		id
																	]
																		.instances?.[
																		idx
																	] !==
																		undefined && (
																		<Typography
																			variant="caption"
																			sx={{
																				backgroundColor:
																					"grey.200",
																				color: "primary.main",
																				px: 1,
																				py: 0.5,
																				borderRadius: 1,
																				fontSize:
																					"0.8rem",
																				fontWeight: 500,
																			}}
																		>
																			{
																				engineInfo[
																					id
																				]
																					.instances[
																					idx
																				]
																			}
																		</Typography>
																	)}
																</Stack>
															),
														)}
													</Stack>
												)}
											</Stack>
											<Stack sx={{ flex: "0 0 400px" }}>
												<FormControl
													fullWidth
													size="small"
													sx={{ minWidth: 200 }}
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
												</FormControl>
											</Stack>
										</Stack>
									))
								) : (
									<Typography
										variant="body2"
										sx={{
											color: "text.secondary",
											fontStyle: "italic",
											textAlign: "center",
											py: 2,
										}}
									>
										No inaccessible engine IDs found.
									</Typography>
								)}
							</Stack>
						</Stack>

						{/* Loading state for engines */}
						{availableEngines.status === "LOADING" && (
							<Stack
								spacing={1}
								alignItems="center"
								sx={{
									p: 2,
									backgroundColor: "background.paper",
									borderRadius: 2,
									border: 1,
									borderColor: "divider",
								}}
							>
								<Typography
									variant="body2"
									sx={{ color: "text.secondary" }}
								>
									Loading available engines...
								</Typography>
							</Stack>
						)}

						{/* Error state for engines */}
						{availableEngines.status === "ERROR" && (
							<Stack
								spacing={1}
								sx={{
									p: 2,
									backgroundColor: "warning.light",
									borderRadius: 2,
									border: 1,
									borderColor: "warning.main",
								}}
							>
								<Typography
									variant="body2"
									sx={{
										color: "warning.dark",
										fontWeight: 500,
									}}
								>
									Error loading available engines
								</Typography>
								<Typography
									variant="caption"
									sx={{ color: "text.secondary" }}
								>
									You may not have access to any engines or
									there was a connection issue.
								</Typography>
							</Stack>
						)}
					</Stack>
				</Modal.Content>
				<Modal.Actions>
					<Stack
						direction="row"
						justifyContent="center"
						spacing={2}
						sx={{ width: "100%", p: 2 }}
					>
						{failedIds.length > 0 && (
							<Button
								variant="contained"
								color="primary"
								onClick={handleSaveReplacements}
								disabled={!hasValidReplacements}
								sx={{
									minWidth: 150,
									py: 1.5,
								}}
							>
								Save Replacements
							</Button>
						)}
						<Button
							variant="outlined"
							onClick={onClose}
							sx={{
								minWidth: 100,
								py: 1.5,
							}}
						>
							{failedIds.length > 0 ? "Cancel" : "OK"}
						</Button>
					</Stack>
				</Modal.Actions>
			</Modal>
			<Modal
				open={showConfirmation}
				fullWidth
				maxWidth={false}
				sx={{
					"& .MuiDialog-paper": {
						width: "80vw",
						maxWidth: 1000,
						minWidth: 320,
					},
				}}
			>
				<Modal.Title>
					<Typography
						variant="h6"
						align="center"
						sx={{ flex: 1, fontWeight: 600 }}
					>
						Engine Replacement Confirmation
					</Typography>
				</Modal.Title>
				<Modal.Content sx={{ p: 3 }}>
					<Typography variant="body1" sx={{ mb: 2, color: "#555" }}>
						The following engine IDs have been replaced:
					</Typography>
					<Stack spacing={1.5} sx={{ pl: 1, width: "100%" }}>
						{Object.entries(replacementDetails).map(
							([failed, detail], index) => (
								<Stack
									key={failed}
									direction="row"
									alignItems="center"
									spacing={3}
									sx={{
										backgroundColor: "background.paper",
										p: 1.5,
										borderRadius: 1,
										border: 1,
										borderColor: "divider",
									}}
								>
									<Stack
										direction="row"
										alignItems="center"
										spacing={1.5}
										sx={{
											flex: "1 1 auto",
											minWidth: 0,
										}}
									>
										<Typography
											variant="body2"
											sx={{
												backgroundColor: "grey.100",
												color: "text.secondary",
												px: 1.5,
												py: 0.5,
												borderRadius: 1,
												minWidth: 24,
												textAlign: "center",
												fontWeight: 500,
												fontSize: "0.875rem",
											}}
										>
											{index + 1}
										</Typography>
										<Typography
											variant="body2"
											sx={{
												wordBreak: "break-all",
												fontFamily: "monospace",
												fontWeight: 500,
											}}
										>
											{failed}
										</Typography>
										<Typography
											variant="body2"
											sx={{
												color: "text.secondary",
												fontWeight: "bold",
											}}
										>
											&rarr;
										</Typography>
										<Typography
											variant="body2"
											sx={{
												wordBreak: "break-all",
												fontFamily: "monospace",
												color: "success.main",
												fontWeight: 500,
											}}
										>
											{detail.replacement}
										</Typography>
										<span
											style={{
												color: "#1976d2",
												fontWeight: 500,
												marginLeft: 12,
											}}
										>
											( {detail.engineName} )
										</span>
										{detail.files &&
											detail.files.length > 0 && (
												<Stack
													direction="row"
													spacing={1}
													sx={{ mt: 0.5 }}
												>
													{detail.files.map(
														(file) => (
															<Typography
																key={file}
																variant="caption"
																sx={{
																	backgroundColor:
																		"grey.100",
																	color: "text.secondary",
																	px: 1,
																	py: 0.5,
																	borderRadius: 1,
																	fontSize:
																		"0.8rem",
																	fontWeight: 500,
																}}
															>
																{file}
															</Typography>
														),
													)}
												</Stack>
											)}
									</Stack>
								</Stack>
							),
						)}
					</Stack>
				</Modal.Content>
				<Modal.Actions>
					<Stack
						direction="row"
						justifyContent="center"
						sx={{ width: "100%", p: 2 }}
					>
						<Button
							variant="contained"
							color="primary"
							onClick={handleConfirmationClose}
							sx={{
								minWidth: 150,
								py: 1.5,
							}}
						>
							OK
						</Button>
					</Stack>
				</Modal.Actions>
			</Modal>
		</>
	);
};

export default EngineIdsModal;
