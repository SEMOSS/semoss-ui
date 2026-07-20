import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Box,
	Button,
	Chip,
	Collapse,
	IconButton,
	List,
	ListItemButton,
	ListItemText,
	Typography,
} from "@mui/material";
import type { RemoteBrowserRecordedStep } from "../../types/browserEvents";

interface RecordedStepsPanelProps {
	open: boolean;
	isRecording: boolean;
	steps: RemoteBrowserRecordedStep[];
	onToggle: () => void;
	onSave: () => void;
}

export function RecordedStepsPanel({
	open,
	isRecording,
	steps,
	onToggle,
	onSave,
}: RecordedStepsPanelProps) {
	return (
		<>
			<Box
				sx={{
					px: 0.75,
					py: 0.4,
					display: "flex",
					alignItems: "center",
					gap: 0.5,
					borderBottom: open ? "1px solid" : 0,
					borderColor: "divider",
				}}
			>
				<IconButton
					size="small"
					disabled={!isRecording && steps.length === 0}
					onClick={onToggle}
					sx={{ p: 0.25 }}
				>
					{open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
				</IconButton>
				<Box sx={{ flex: 1 }}>
					<Typography variant="subtitle2">Recorded steps</Typography>
					<Typography variant="caption" color="text.secondary">
						Current unsaved recording window
					</Typography>
				</Box>
				<Chip size="small" label={`${steps.length}`} />
				<Button size="small" disabled={!isRecording} onClick={onSave}>
					Save
				</Button>
			</Box>
			<Collapse in={open}>
				<List dense disablePadding>
					{steps.length === 0 ? (
						<Box sx={{ p: 2 }}>
							<Typography variant="body2" color="text.secondary">
								{isRecording
									? "Interact with the browser to see recorded steps."
									: "Start recording to preview captured steps."}
							</Typography>
						</Box>
					) : (
						steps.map((step, index) => (
							<ListItemButton
								key={`${step.timestamp ?? index}-${index}`}
								disabled
								sx={{ py: 0.5, px: 1 }}
							>
								<ListItemText
									primary={
										<Typography
											variant="body2"
											sx={{ fontWeight: 600 }}
										>
											#{index + 1} {step.type || "STEP"}
										</Typography>
									}
									secondary={
										<Typography
											variant="caption"
											color="text.secondary"
											component="span"
										>
											{step.selector
												? `${step.role || "selector"}: ${step.selector}`
												: ""}
											{step.text
												? ` · "${step.text}"`
												: ""}
											{step.coordinates
												? ` · (${Math.round(step.coordinates.x)}, ${Math.round(step.coordinates.y)})`
												: ""}
										</Typography>
									}
								/>
							</ListItemButton>
						))
					)}
				</List>
			</Collapse>
		</>
	);
}
