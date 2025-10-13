import Close from "@mui/icons-material/Close";
import React, { useEffect, useState } from "react";
import {
	Button,
	FormControl,
	IconButton,
	Modal,
	Select,
	Stack,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	replaceInaccessibleEnginesPixel,
	useMyEnginesPixel,
} from "@/pixel/projects";
import type {
	EngineCardProps,
	EngineIdsModalProps,
	ReplaceEnginesOutput,
} from "./save-app.types";

const EngineCard: React.FC<EngineCardProps> = ({
	name,
	id,
	fileList = [],
	instanceList = [],
	showFiles = false,
	openFilesId,
	setOpenFilesId,
	fileListRef,
	showReplacement = false,
	replacementValue = "",
	onReplacementChange,
	availableEngines,
	showReplacementPlaceholder = false,
	confirmationReplacement = "",
	confirmation = false,
}) => (
	<Stack
		spacing={1.5}
		sx={{
			backgroundColor: "#fafbfc",
			p: 1,
			borderRadius: 2,
			border: "1px solid #e0e0e0",
			boxShadow: 0,
			mb: 1,
		}}
	>
		{/* Engine Name */}
		{name && (
			<Stack direction="row" alignItems="center" spacing={1}>
				<Typography
					variant="subtitle2"
					sx={{ fontWeight: 700, fontSize: "1.05rem", color: "#222" }}
				>
					{name}
				</Typography>
			</Stack>
		)}
		{/* Engine ID */}
		<Stack direction="row" alignItems="center" spacing={0.2}>
			<Typography
				variant="subtitle2"
				sx={{ fontWeight: 500, fontSize: "0.98rem", color: "#222" }}
			>
				Engine ID:
			</Typography>
			<Typography
				variant="body2"
				sx={{
					fontFamily: "monospace",
					wordBreak: "break-all",
					flex: 1,
					fontSize: "0.98rem",
					color: "#444",
				}}
			>
				{id}
			</Typography>
		</Stack>
		{/* Replacement Engine (dropdown or confirmation) */}
		{showReplacement && !confirmation && (
			<Stack direction="row" alignItems="center" spacing={0.2}>
				<Typography
					variant="subtitle2"
					sx={{ fontWeight: 500, fontSize: "0.98rem", color: "#222" }}
				>
					Replacement Engine:
				</Typography>
				<FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
					<Select
						value={replacementValue || ""}
						onChange={(e) =>
							onReplacementChange?.(id, e.target.value as string)
						}
						sx={{
							"& .MuiSelect-select": {
								py: 1,
								fontSize: "0.98rem",
							},
						}}
					>
						{availableEngines?.data?.map((engine) => (
							<Select.Item
								key={engine.database_id || engine.app_id}
								value={engine.database_id || engine.app_id}
								sx={{ fontSize: "0.98rem" }}
							>
								{engine.database_name || engine.app_name}{" "}
								<Typography
									component="span"
									variant="body2"
									sx={{
										color: "#666",
										fontSize: "0.85rem",
										display: "inline",
									}}
								>
									({engine.database_type || engine.app_type})
								</Typography>
							</Select.Item>
						))}
					</Select>
					{showReplacementPlaceholder && !replacementValue && (
						<Typography
							component="span"
							variant="body2"
							sx={{
								position: "absolute",
								left: 16,
								top: 8,
								color: "#999",
								fontStyle: "italic",
								pointerEvents: "none",
								fontSize: "0.98rem",
							}}
						>
							Select replacement engine
						</Typography>
					)}
				</FormControl>
			</Stack>
		)}
		{confirmation && confirmationReplacement && (
			<Stack direction="row" alignItems="center" spacing={0.2}>
				<Typography
					variant="subtitle2"
					sx={{ fontWeight: 500, fontSize: "0.98rem", color: "#222" }}
				>
					Replaced With:
				</Typography>
				<Typography
					variant="body2"
					sx={{
						fontFamily: "monospace",
						wordBreak: "break-all",
						flex: 1,
						fontSize: "0.98rem",
						color: "success.main",
						fontWeight: 500,
					}}
				>
					{confirmationReplacement}
				</Typography>
			</Stack>
		)}
		{/* Files Containing Engine ID (count) and See Files button */}
		{fileList.length > 0 && !confirmation && (
			<Stack direction="row" alignItems="center" spacing={0.2}>
				<Typography
					variant="subtitle2"
					sx={{ fontWeight: 500, fontSize: "0.98rem", color: "#222" }}
				>
					Files Containing Engine ID:
				</Typography>
				<Typography
					variant="body2"
					sx={{ fontWeight: 500, fontSize: "0.98rem", color: "#444" }}
				>
					{fileList.length}
				</Typography>
				{setOpenFilesId && openFilesId !== undefined && (
					<Button
						variant="text"
						size="small"
						onClick={() =>
							setOpenFilesId(openFilesId === id ? null : id)
						}
					>
						See Files
					</Button>
				)}
			</Stack>
		)}
		{/* File Name and Occurrence List (expandable) */}
		{showFiles && openFilesId === id && fileList.length > 0 && (
			<div ref={fileListRef}>
				<Stack
					spacing={0.7}
					sx={{
						mt: 1,
						ml: 0,
						p: 1.2,
						border: "1px solid #e0e0e0",
						borderRadius: 2,
						backgroundColor: "#f5f6fa",
					}}
				>
					<Stack
						direction="row"
						spacing={2}
						sx={{
							fontWeight: 600,
							color: "#888",
							fontSize: "0.97rem",
						}}
					>
						<Typography variant="caption" sx={{ minWidth: 170 }}>
							File Name
						</Typography>
						<Typography variant="caption" sx={{ minWidth: 90 }}>
							Occurrence
						</Typography>
					</Stack>
					{fileList.map((file, idx) => (
						<Stack
							key={file}
							direction="row"
							spacing={0.2}
							alignItems="center"
						>
							<Typography
								variant="body2"
								sx={{
									minWidth: 170,
									fontFamily: "monospace",
									fontSize: "0.97rem",
									color: "#444",
								}}
							>
								{file}
							</Typography>
							<Typography
								variant="body2"
								sx={{
									minWidth: 90,
									fontSize: "0.97rem",
									color: "#444",
								}}
							>
								{Array.isArray(instanceList) &&
								instanceList[idx] !== undefined
									? instanceList[idx]
									: "-"}
							</Typography>
						</Stack>
					))}
				</Stack>
			</div>
		)}
	</Stack>
);

/**
 * EngineIdsModal
 * Modal for displaying discovered engine IDs, handling inaccessible engines, and managing replacements.
 * Shows accessible and inaccessible engines, allows replacement selection, and confirms changes.
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
	// --- State Management ---
	const [engineReplacements, setEngineReplacements] = useState<
		Record<string, string>
	>({});
	const notification = useNotification();
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [replacementsToShow, setReplacementsToShow] = useState<
		Record<string, string>
	>({});
	const [showDiscovery, setShowDiscovery] = useState(open);
	const [replacementDetails, setReplacementDetails] = useState<
		Record<
			string,
			{ replacement: string; files: string[]; engineName: string }
		>
	>({});
	const [openFilesId, setOpenFilesId] = useState<string | null>(null);
	const fileListRef = React.useRef<HTMLDivElement | null>(null);

	// --- Click-away handler for file list (closes file list when clicking outside) ---
	useEffect(() => {
		if (!openFilesId) return;
		function handleClick(event: MouseEvent) {
			if (
				fileListRef.current &&
				!fileListRef.current.contains(event.target as Node)
			) {
				setOpenFilesId(null);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [openFilesId]);

	// --- Fetch available engines user can select as replacements ---
	const availableEngines = useMyEnginesPixel();

	// --- Initialize replacement state when modal opens ---
	useEffect(() => {
		if (open && failedIds.length > 0) {
			const initialReplacements: Record<string, string> = {};
			failedIds.forEach((id) => {
				initialReplacements[id] = "";
			});
			setEngineReplacements(initialReplacements);
		}
	}, [open, failedIds]);

	// --- Sync modal visibility with parent state ---
	useEffect(() => {
		setShowDiscovery(open);
	}, [open]);

	// --- Handle replacement engine selection for an inaccessible engine ---
	const handleEngineReplacementChange = (
		failedEngineId: string,
		replacementEngineId: string,
	) => {
		setEngineReplacements((prev) => ({
			...prev,
			[failedEngineId]: replacementEngineId,
		}));
	};

	// --- Save engine replacements, show confirmation modal, and handle errors ---
	const handleSaveReplacements = async () => {
		const validReplacements = Object.entries(engineReplacements)
			.filter(([, replacement]) => replacement !== "")
			.reduce(
				(acc, [failed, replacement]) => {
					acc[failed] = replacement;
					return acc;
				},
				{} as Record<string, string>,
			);

		const response = await replaceInaccessibleEnginesPixel(
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
			notification.add({ color: "error", message: errorMsg });
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

	// --- Handle closing the confirmation modal ---
	const handleConfirmationClose = () => {
		setShowConfirmation(false);
		if (onEngineReplacement) {
			onEngineReplacement(replacementsToShow);
		}
		setShowDiscovery(false);
		onClose();
	};

	return (
		<>
			<Modal
				open={showDiscovery}
				maxWidth={false}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
					"& .MuiDialog-paper": {
						width: 600,
						maxWidth: "95vw",
						minWidth: 320,
						height: 540,
						maxHeight: "95vh",
						borderRadius: 3,
						boxShadow: 8,
						p: 0,
						display: "flex",
						flexDirection: "column",
						justifyContent: "flex-start",
					},
				}}
			>
				<Modal.Title>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<Typography
							variant="h6"
							align="left"
							sx={{
								fontWeight: 600,
								fontSize: "1.25rem",
								color: "#222",
								letterSpacing: 0,
							}}
						>
							Engine IDs Discovery
						</Typography>
						<IconButton aria-label="close" onClick={onClose}>
							<Close />
						</IconButton>
					</Stack>
				</Modal.Title>
				<Modal.Content sx={{ p: 0 }}>
					<Stack spacing={2.1} sx={{ width: "100%", p: 3, pt: 0 }}>
						<Typography
							variant="body1"
							align="left"
							sx={{
								color: "#555",
								fontSize: "1rem",
								mb: 0.5,
								mt: 0,
							}}
						>
							The following engine IDs were detected in your
							application:
						</Typography>
						{/* Accessible Engines Section */}
						<Stack spacing={1.5} sx={{ width: "100%" }}>
							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
							>
								<Typography
									variant="subtitle1"
									sx={{
										color: "#1a7f37",
										fontWeight: 600,
										fontSize: "1.05rem",
									}}
								>
									Accessible Engines
								</Typography>
								<Typography
									variant="body2"
									sx={{
										color: "#888",
										fontWeight: 500,
										fontSize: "1rem",
									}}
								>
									({successIds.length})
								</Typography>
							</Stack>
							<Stack spacing={1.5} sx={{ pl: 0, width: "100%" }}>
								{successIds.length > 0 ? (
									successIds.map((id) => (
										<EngineCard
											key={id}
											name={engineInfo?.[id]?.name}
											id={id}
											fileList={
												engineInfo?.[id]?.files || []
											}
											instanceList={
												engineInfo?.[id]?.instances ||
												[]
											}
											showFiles={true}
											openFilesId={openFilesId}
											setOpenFilesId={setOpenFilesId}
											fileListRef={fileListRef}
										/>
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
									variant="subtitle1"
									sx={{
										color: "#d32f2f",
										fontWeight: 600,
										fontSize: "1.05rem",
									}}
								>
									Inaccessible Engines
								</Typography>
								<Typography
									variant="body2"
									sx={{
										color: "#888",
										fontWeight: 500,
										fontSize: "1rem",
									}}
								>
									({failedIds.length})
								</Typography>
							</Stack>
							<Stack spacing={1.5} sx={{ pl: 0, width: "100%" }}>
								{failedIds.length > 0 ? (
									failedIds.map((id) => (
										<EngineCard
											key={id}
											name={engineInfo?.[id]?.name}
											id={id}
											fileList={
												engineInfo?.[id]?.files || []
											}
											instanceList={
												engineInfo?.[id]?.instances ||
												[]
											}
											showFiles={true}
											openFilesId={openFilesId}
											setOpenFilesId={setOpenFilesId}
											fileListRef={fileListRef}
											showReplacement={true}
											replacementValue={
												engineReplacements[id]
											}
											onReplacementChange={
												handleEngineReplacementChange
											}
											availableEngines={availableEngines}
											showReplacementPlaceholder={true}
										/>
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
						flex={1}
						direction="row"
						justifyContent="end"
						alignItems="center"
						spacing={1}
						padding={2}
					>
						<Button variant="text" onClick={onClose}>
							{failedIds.length > 0 ? "Cancel" : "OK"}
						</Button>
						{failedIds.length > 0 && (
							<Button
								variant="contained"
								onClick={handleSaveReplacements}
							>
								Save Replacements
							</Button>
						)}
					</Stack>
				</Modal.Actions>
			</Modal>
			<Modal
				open={showConfirmation}
				maxWidth={false}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
					"& .MuiDialog-paper": {
						width: 600,
						maxWidth: "95vw",
						minWidth: 320,
						minHeight: 220,
						height: "auto",
						maxHeight: 540,
						borderRadius: 3,
						boxShadow: 8,
						p: 0,
						display: "flex",
						flexDirection: "column",
						justifyContent: "flex-start",
					},
				}}
			>
				<Modal.Title>
					<Typography
						variant="h6"
						align="left"
						sx={{ flex: 1, fontWeight: 600 }}
					>
						Engine Replacement Confirmation
					</Typography>
				</Modal.Title>
				<Modal.Content sx={{ p: 3 }}>
					<Typography variant="body1" sx={{ mb: 2, color: "#555" }}>
						The following engine IDs have been replaced:
					</Typography>
					<Stack spacing={1.5} sx={{ pl: 0, width: "100%" }}>
						{Object.entries(replacementDetails).map(
							([failed, detail]) => (
								<EngineCard
									key={failed}
									name={detail.engineName}
									id={failed}
									confirmation={true}
									confirmationReplacement={detail.replacement}
								/>
							),
						)}
					</Stack>
				</Modal.Content>
				<Modal.Actions>
					<Stack
						flex={1}
						direction="row"
						justifyContent="end"
						alignItems="center"
						spacing={1}
						padding={2}
					>
						<Button
							variant="contained"
							onClick={handleConfirmationClose}
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
