import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
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
	TextField,
	Typography,
} from "@mui/material";
import type React from "react";
import { useEffect, useState } from "react";
import type { SelectedTextContext } from "../types/browserEvents";

interface SelectedTextContextsPanelProps {
	open: boolean;
	contexts: SelectedTextContext[];
	onToggle: () => void;
	onCopy: (context: SelectedTextContext) => void;
	onDelete: (contextId: string) => void;
	onSave: (contextId: string, content: string) => void;
}

function contextLabel(context: SelectedTextContext, index: number): string {
	if (context.label?.trim()) return context.label;
	if (context.title?.trim())
		return `${context.title} · Selection ${index + 1}`;
	return `Selected text ${index + 1}`;
}

export const SelectedTextContextsPanel: React.FC<
	SelectedTextContextsPanelProps
> = ({ open, contexts, onToggle, onCopy, onDelete, onSave }) => {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");

	useEffect(() => {
		if (
			editingId &&
			!contexts.some((context) => context.id === editingId)
		) {
			setEditingId(null);
			setDraft("");
		}
	}, [contexts, editingId]);

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
					disabled={contexts.length === 0}
					onClick={onToggle}
					sx={{ p: 0.25 }}
					aria-label={
						open
							? "Collapse captured contexts"
							: "Expand captured contexts"
					}
				>
					{open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
				</IconButton>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography variant="subtitle2">
						Captured contexts
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Selected visible website text
					</Typography>
				</Box>
				<Chip size="small" label={`${contexts.length}`} />
			</Box>
			<Collapse in={open}>
				<Box sx={{ p: 0.75 }}>
					{contexts.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							Choose Capture Context, then drag over website text.
						</Typography>
					) : (
						contexts.map((context, index) => {
							const isEditing = editingId === context.id;
							return (
								<Accordion
									key={context.id}
									disableGutters
									elevation={0}
									sx={{
										border: "1px solid",
										borderColor: "divider",
										mb: 0.75,
										"&:before": { display: "none" },
									}}
								>
									<AccordionSummary
										expandIcon={<ExpandMoreIcon />}
									>
										<Box sx={{ minWidth: 0 }}>
											<Typography
												variant="body2"
												fontWeight={700}
												noWrap
											>
												{contextLabel(context, index)}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
												noWrap
											>
												Step {context.throughStepId} ·{" "}
												{context.url}
											</Typography>
										</Box>
									</AccordionSummary>
									<AccordionDetails sx={{ pt: 0 }}>
										<Stack
											direction="row"
											spacing={0.5}
											flexWrap="wrap"
											useFlexGap
											sx={{ mb: 0.75 }}
										>
											<Chip
												size="small"
												color="primary"
												label="Selected text"
											/>
											<Chip
												size="small"
												label={
													context.extractionMethod ===
													"dom-range"
														? "Exact range"
														: "Area text"
												}
											/>
											<Chip
												size="small"
												label={`${context.content.length} chars`}
											/>
											{context.edited && (
												<Chip
													size="small"
													label="Edited"
												/>
											)}
											{context.stats.truncated && (
												<Chip
													size="small"
													color="warning"
													label="Bounded"
												/>
											)}
										</Stack>
										{isEditing ? (
											<TextField
												fullWidth
												multiline
												minRows={6}
												maxRows={14}
												value={draft}
												onChange={(event) =>
													setDraft(event.target.value)
												}
												label="Selected website text"
											/>
										) : (
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
													bgcolor:
														"background.default",
													border: "1px solid",
													borderColor: "divider",
													borderRadius: 1,
													p: 1,
												}}
											>
												{context.content}
											</Box>
										)}
										<Stack
											direction="row"
											spacing={0.5}
											sx={{ mt: 0.75 }}
										>
											{isEditing ? (
												<>
													<Button
														size="small"
														variant="contained"
														disabled={!draft.trim()}
														onClick={() => {
															onSave(
																context.id,
																draft.trim(),
															);
															setEditingId(null);
															setDraft("");
														}}
													>
														Save
													</Button>
													<Button
														size="small"
														onClick={() => {
															setEditingId(null);
															setDraft("");
														}}
													>
														Cancel
													</Button>
												</>
											) : (
												<>
													<Button
														size="small"
														startIcon={<EditIcon />}
														onClick={() => {
															setEditingId(
																context.id,
															);
															setDraft(
																context.content,
															);
														}}
													>
														Edit
													</Button>
													<Button
														size="small"
														startIcon={
															<ContentCopyIcon />
														}
														onClick={() =>
															onCopy(context)
														}
													>
														Copy
													</Button>
													<Button
														size="small"
														color="error"
														startIcon={
															<DeleteOutlineIcon />
														}
														onClick={() =>
															onDelete(context.id)
														}
													>
														Delete
													</Button>
												</>
											)}
										</Stack>
									</AccordionDetails>
								</Accordion>
							);
						})
					)}
				</Box>
			</Collapse>
		</>
	);
};
