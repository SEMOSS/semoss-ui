import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Chip,
	Collapse,
	IconButton,
	Stack,
	Typography,
} from "@mui/material";
import type React from "react";
import type { ContextSnapshot } from "../types/browserEvents";

interface ContextSnapshotsPanelProps {
	open: boolean;
	snapshots: ContextSnapshot[];
	onToggle: () => void;
	onCopy: (snapshot: ContextSnapshot) => void;
	onDelete: (snapshotId: string) => void;
}

function snapshotLabel(snapshot: ContextSnapshot, index: number): string {
	if (snapshot.label?.trim()) return snapshot.label;
	if (snapshot.title?.trim())
		return `${snapshot.title} · Context ${index + 1}`;
	return `Context ${index + 1}`;
}

export const ContextSnapshotsPanel: React.FC<ContextSnapshotsPanelProps> = ({
	open,
	snapshots,
	onToggle,
	onCopy,
	onDelete,
}) => (
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
				disabled={snapshots.length === 0}
				onClick={onToggle}
				sx={{ p: 0.25 }}
				aria-label={
					open
						? "Collapse context snapshots"
						: "Expand context snapshots"
				}
			>
				{open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
			</IconButton>
			<Box sx={{ flex: 1, minWidth: 0 }}>
				<Typography variant="subtitle2">Context snapshots</Typography>
				<Typography variant="caption" color="text.secondary">
					DOM, page semantics, and recorded actions
				</Typography>
			</Box>
			<Chip size="small" label={`${snapshots.length}`} />
		</Box>
		<Collapse in={open}>
			<Box sx={{ p: 0.75 }}>
				{snapshots.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						Capture context to store a navigation snapshot.
					</Typography>
				) : (
					snapshots.map((snapshot, index) => (
						<Accordion
							key={snapshot.id}
							disableGutters
							elevation={0}
							sx={{
								border: "1px solid",
								borderColor: "divider",
								mb: 0.75,
								"&:before": { display: "none" },
							}}
						>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Box sx={{ minWidth: 0 }}>
									<Typography
										variant="body2"
										fontWeight={700}
										noWrap
									>
										{snapshotLabel(snapshot, index)}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										noWrap
									>
										Step {snapshot.throughStepId} ·{" "}
										{snapshot.url}
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails sx={{ pt: 0 }}>
								<Stack
									direction="row"
									spacing={0.5}
									alignItems="center"
									flexWrap="wrap"
									useFlexGap
									sx={{ mb: 0.75 }}
								>
									<Chip
										size="small"
										label={`${snapshot.stats.includedElementCount} actions`}
									/>
									<Chip
										size="small"
										label={`${snapshot.stats.characterCount} chars`}
									/>
									{snapshot.stats.truncated && (
										<Chip
											size="small"
											color="warning"
											label="bounded"
										/>
									)}
								</Stack>
								<Box
									component="pre"
									sx={{
										m: 0,
										maxHeight: 360,
										overflow: "auto",
										whiteSpace: "pre-wrap",
										wordBreak: "break-word",
										fontFamily: "monospace",
										fontSize: 11,
										lineHeight: 1.45,
										bgcolor: "background.default",
										border: "1px solid",
										borderColor: "divider",
										borderRadius: 1,
										p: 1,
									}}
								>
									{snapshot.text}
								</Box>
								<Stack
									direction="row"
									spacing={0.5}
									sx={{ mt: 0.75 }}
								>
									<Button
										size="small"
										startIcon={<ContentCopyIcon />}
										onClick={() => onCopy(snapshot)}
									>
										Copy
									</Button>
									<Button
										size="small"
										color="error"
										startIcon={<DeleteOutlineIcon />}
										onClick={() => onDelete(snapshot.id)}
									>
										Delete
									</Button>
								</Stack>
							</AccordionDetails>
						</Accordion>
					))
				)}
			</Box>
		</Collapse>
	</>
);
