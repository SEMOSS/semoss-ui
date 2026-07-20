import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import EditIcon from "@mui/icons-material/Edit";
import {
	Box,
	Chip,
	CircularProgress,
	IconButton,
	ListItemButton,
	ListItemText,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import type { PlaybackController } from "../../hooks/usePlaybackController";
import type { LoadedRecordingStep } from "../../types/browserEvents";

interface RecordingStepRowProps {
	tabId: string;
	step: LoadedRecordingStep;
	index: number;
	playback: PlaybackController;
}

export function RecordingStepRow({
	tabId,
	step,
	index,
	playback,
}: RecordingStepRowProps) {
	const stepId = typeof step.id === "number" ? step.id : undefined;
	const isRunning = playback.runningStepId === stepId;
	const isDone = stepId !== undefined && playback.executedStepIds.has(stepId);
	const disabled =
		playback.isRunning || step.shouldRun === false || stepId === undefined;
	const isType = step.type === "TYPE" && stepId !== undefined;
	const displayValue =
		stepId !== undefined
			? (playback.editedTypeValues[stepId] ?? step.text ?? "")
			: (step.text ?? "");
	const isEditing = isType && playback.editingStepId === stepId;
	const needsValue = isType && playback.valueRequiredStepId === stepId;

	return (
		<Box
			sx={{
				borderBottom: "1px solid",
				borderColor: needsValue ? "warning.main" : "divider",
				bgcolor: needsValue ? "rgba(237, 108, 2, 0.08)" : "transparent",
			}}
		>
			<ListItemButton
				disabled={disabled}
				selected={isRunning}
				onClick={() => playback.runStep(tabId, step)}
				sx={{
					alignItems: "flex-start",
					py: 0.5,
					px: 1,
					pr: isType ? 0.25 : 1,
				}}
			>
				<ListItemText
					primary={
						<Stack direction="row" spacing={1} alignItems="center">
							<Typography
								variant="body2"
								sx={{ fontWeight: 600 }}
							>
								#{stepId ?? index + 1} {step.type || "STEP"}
							</Typography>
							{isRunning && <CircularProgress size={12} />}
							{isDone && (
								<Chip
									size="small"
									color="success"
									label="done"
								/>
							)}
							{step.shouldRun === false && (
								<Chip size="small" label="skipped" />
							)}
							{needsValue && (
								<Chip
									size="small"
									color="warning"
									label="value required"
								/>
							)}
						</Stack>
					}
					secondary={
						<Typography
							variant="caption"
							color="text.secondary"
							component="span"
						>
							{tabId}
							{typeof step.label === "string" && step.label
								? ` · ${step.label}`
								: ""}
							{typeof displayValue === "string" && displayValue
								? ` · "${displayValue}"`
								: ""}
						</Typography>
					}
				/>
				{isType && (
					<Tooltip title="Edit typed value">
						<span>
							<IconButton
								size="small"
								disabled={playback.isRunning}
								sx={{ p: 0.5 }}
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									playback.setEditingStepId(
										playback.editingStepId === stepId
											? null
											: stepId,
									);
								}}
							>
								<EditIcon fontSize="small" />
							</IconButton>
						</span>
					</Tooltip>
				)}
			</ListItemButton>
			{isEditing && stepId !== undefined && (
				<Box
					sx={{ px: 1, pb: 0.75 }}
					onClick={(event) => event.stopPropagation()}
					onMouseDown={(event) => event.stopPropagation()}
				>
					<TextField
						size="small"
						fullWidth
						autoFocus={needsValue}
						label={
							typeof step.label === "string" && step.label
								? step.label
								: `Step ${stepId} value`
						}
						type={step.isPassword === true ? "password" : "text"}
						value={playback.editedTypeValues[stepId] ?? ""}
						error={needsValue}
						onChange={(event) =>
							playback.updateTypeValue(stepId, event.target.value)
						}
						helperText={
							needsValue
								? "Enter a value, then click Run/Resume to continue."
								: typeof step.description === "string" &&
										step.description
									? step.description
									: "This value is used when replaying this TYPE step."
						}
						InputProps={{
							endAdornment: (
								<Stack direction="row" spacing={0.25}>
									<IconButton
										size="small"
										onClick={() =>
											playback.setEditingStepId(null)
										}
									>
										<DoneIcon fontSize="small" />
									</IconButton>
									<IconButton
										size="small"
										onClick={() =>
											playback.resetTypeValue(
												stepId,
												typeof step.text === "string"
													? step.text
													: "",
											)
										}
									>
										<CloseIcon fontSize="small" />
									</IconButton>
								</Stack>
							),
						}}
					/>
				</Box>
			)}
		</Box>
	);
}
