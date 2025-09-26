import {
	AutoFixHighOutlined,
	ContentCopy,
	Delete,
	Edit,
	MoreVert,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { ActionMessages, useBlocks, type Variable } from "@semoss/renderer";
import {
	Box,
	Button,
	Icon,
	IconButton,
	List,
	Menu,
	Modal,
	Stack,
	styled,
	TextField,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useWorkspace } from "@/hooks";
import { suggestVariableRenames } from "../blocks-workspace/utils";
import { AddVariablePopover } from "./AddVariablePopover";
import { VariablePreview } from "./VariablePreview";

const StyledListItem = styled(List.Item)(() => ({
	"&.MuiListItem-root": {
		paddingTop: "0px",
		paddingBottom: "0px",
	},
}));

const StyledTooltip = styled(Tooltip)(() => ({
	fontWeight: "bold",
}));

const StyledButton = styled("button")(({ theme }) => ({
	border: "none",
	background: "none",
	padding: 0,
	margin: 0,
	outline: "none",
	width: "100%",
	display: "flex",
	"&:hover": {
		cursor: "pointer",
	},
}));

const StyledPointerStack = styled(Stack)(({ theme }) => ({
	width: "80%",
	overflow: "scroll",
	"&:hover": {
		cursor: "pointer",
	},
}));

const StyledListItemText = styled(List.ItemText)(({ theme }) => ({
	// May not actually be needed, browser was being weird
	"&:hover": {
		cursor: "pointer",
	},
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
	color: "rgb(0,0,0)",
}));

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.error.main,
}));

const StyledCapitalizedTypography = styled(Typography)(() => ({
	textTransform: "capitalize",
}));

const StyledAnchorSpan = styled("span")(({ theme }) => ({
	position: "absolute",
	left: 100,
}));

const StyledStack = styled(Stack)(({ theme }) => ({
	width: "80%",
}));

const StyledTextField = styled(TextField)(() => ({
	padding: "0px",
}));

const StyledEmptyDiv = styled("div")(() => ({
	padding: "0px",
}));

interface NotebookTokenProps {
	/** Id of the variable */
	id: string;
	/** Variable Value */
	variable: Variable;
	/** Engines loaded in root variable menu */
	engines: {
		models: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
		databases: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
		storages: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
		functions: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
		vectors: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
	};
}

export const NotebookVariable = observer((props: NotebookTokenProps) => {
	const { id, variable, engines } = props;
	const { state } = useBlocks();
	const notification = useNotification();

	const { workspace } = useWorkspace();

	const [openRenameAlias, setOpenRenameAlias] = useState(false);
	const [anchorEl, setAnchorEl] = useState(null);
	const [newTokenAlias, setNewTokenAlias] = useState(id);
	const [popoverAnchorEle, setPopoverAnchorEl] = useState<HTMLElement | null>(
		null,
	);
	const isPopoverOpen = Boolean(popoverAnchorEle);

	// Auto-rename state
	const [isAutoRenameModalOpen, setIsAutoRenameModalOpen] = useState(false);
	const [suggestedNewName, setSuggestedNewName] = useState<string>("");
	const [suggestedNewNameRecords, setSuggestedNewNameRecords] = useState<
		Record<string, string>
	>({});
	const [isProcessing, setIsProcessing] = useState(false);

	const spanRef = useRef();

	/**
	 * Handle auto-rename for this specific variable
	 */
	const handleAutoRename = async () => {
		setIsProcessing(true);
		try {
			const changes = await suggestVariableRenames(
				state,
				workspace.agentModelEngine,
				id,
			);
			if (
				typeof changes === "object" &&
				changes !== null &&
				changes[id]
			) {
				setSuggestedNewNameRecords(changes);
				setSuggestedNewName(changes[id]);
				setIsAutoRenameModalOpen(true);
			} else {
				notification.add({
					color: "warning",
					message: "No suggestion available for this variable",
				});
			}
		} catch (error) {
			console.error("Error getting suggested changes:", error);
			notification.add({
				color: "error",
				message: "Failed to get variable name suggestion",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	/**
	 * Simple Python variable name validation
	 */
	const isValidPythonVariableName = (name: string): boolean => {
		// Must start with letter or underscore
		if (!/^[a-zA-Z_]/.test(name)) return false;
		// Can only contain letters, numbers, and underscores
		if (!/^[a-zA-Z0-9_]+$/.test(name)) return false;
		// Cannot be empty
		if (name.length === 0) return false;
		return true;
	};

	/**
	 * Apply the suggested rename
	 */
	const handleApplyRename = async () => {
		if (!suggestedNewName) return;

		// Validate the suggested name
		if (!isValidPythonVariableName(suggestedNewName)) {
			notification.add({
				color: "error",
				message: `Invalid variable name: ${suggestedNewName}. Must start with letter/underscore and contain only letters, numbers, and underscores.`,
			});
			return;
		}

		setIsProcessing(true);

		try {
			const out = JSON.parse(JSON.stringify(state.queries));

			const placeholderRegex = /{{\s*([^{}\s]+)\s*}}/g;

			Object.keys(out).forEach((topKey) => {
				const obj = out[topKey];
				if (!obj || !Array.isArray(obj.cells)) return;
				const qID = obj.id;

				obj.cells.forEach((cell) => {
					if (!cell) return;
					const params = cell.parameters || {};

					// For code widget → replace inside params.code
					if (
						cell.widget === "code" &&
						typeof params.code === "string"
					) {
						params.code = params.code.replace(
							placeholderRegex,
							(match, varName) => {
								if (
									Object.hasOwn(
										suggestedNewNameRecords,
										varName,
									)
								) {
									return `{{${suggestedNewNameRecords[varName]}}}`;
								}
								return match;
							},
						);
					}

					// For query widget → replace inside params.selectQuery
					if (
						cell.widget === "query-import" &&
						typeof params.selectQuery === "string"
					) {
						params.selectQuery = params.selectQuery.replace(
							placeholderRegex,
							(match, varName) => {
								if (
									Object.hasOwn(
										suggestedNewNameRecords,
										varName,
									)
								) {
									return `{{${suggestedNewNameRecords[varName]}}}`;
								}
								return match;
							},
						);
					}

					state.dispatch({
						message: ActionMessages.UPDATE_CELL,
						payload: {
							cellId: cell.id,
							queryId: qID,
							path:
								cell.widget === "code"
									? "parameters.code"
									: "parameters.selectQuery",
							value:
								cell.widget === "code"
									? params.code
									: params.selectQuery,
						},
					});
				});
			});
			const success = await state.dispatch({
				message: ActionMessages.RENAME_VARIABLE,
				payload: {
					id: id,
					alias: suggestedNewName,
				},
			});

			if (success) {
				notification.add({
					color: "success",
					message: `Successfully renamed variable ${id} to ${suggestedNewName}`,
				});
				setIsAutoRenameModalOpen(false);
				setSuggestedNewName("");
			} else {
				notification.add({
					color: "error",
					message: `Failed to rename variable ${id}`,
				});
			}
		} catch (error) {
			console.error("Error applying rename:", error);
			notification.add({
				color: "error",
				message: "Error applying variable rename",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	/**
	 * Copys the alias to use in notebook
	 * @param alias
	 */
	const copyAlias = (alias: string) => {
		try {
			navigator.clipboard.writeText(`{{${alias}}}`);

			notification.add({
				color: "success",
				message: "Successfully copied to clipboard",
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message,
			});
		}
	};

	/**
	 * Effects/Memos
	 */
	const getVariableTypeDisplay: string = useMemo(() => {
		if (
			variable.type !== "query" &&
			variable.type !== "block" &&
			variable.type !== "cell"
		) {
			const engineId = state.getVariable(variable.to, variable.type);
			const engine = engines[`${variable.type}s`]
				? engines[`${variable.type}s`].find(
						(engineValue) => engineValue.app_id === engineId,
					)
				: null;
			if (engine) {
				return engine.app_name;
			} else {
				return variable.type;
			}
		} else {
			return variable.type;
		}
	}, [variable.type, engines, id]);

	return (
		<>
			<StyledListItem
				key={id}
				secondaryAction={
					<Stack
						direction="row"
						spacing={1}
						alignItems="center"
						paddingY="8px"
					>
						<IconButton
							onClick={() => {
								copyAlias(id);
								setAnchorEl(null);
							}}
						>
							<ContentCopy />
						</IconButton>
						<IconButton
							title="Open Menu"
							onClick={(e) => {
								e.preventDefault();
								setAnchorEl(e.currentTarget);
							}}
						>
							<MoreVert />
						</IconButton>
						<StyledAnchorSpan ref={spanRef} />
						<Menu
							anchorEl={anchorEl}
							open={Boolean(anchorEl)}
							onClose={() => {
								setAnchorEl(null);
							}}
						>
							<Menu.Item
								value="Edit"
								onClick={(e) => {
									setPopoverAnchorEl(spanRef.current);
									setAnchorEl(null);
								}}
							>
								<Stack direction="row" alignItems="center">
									<StyledIcon color="secondary">
										<Edit />
									</StyledIcon>
									<Typography variant="body2">
										Edit
									</Typography>
								</Stack>
							</Menu.Item>
							<Menu.Item
								value="AutoRename"
								onClick={() => {
									handleAutoRename();
									setAnchorEl(null);
								}}
								disabled={
									isProcessing || !workspace.agentModelEngine
								}
							>
								<Stack direction="row" alignItems="center">
									<StyledIcon color="primary">
										<AutoFixHighOutlined />
									</StyledIcon>
									<Typography variant="body2">
										{isProcessing
											? "Processing..."
											: "Auto Rename"}
									</Typography>
								</Stack>
							</Menu.Item>
							<Menu.Item
								value="Delete"
								onClick={() => {
									state.dispatch({
										message: ActionMessages.DELETE_VARIABLE,
										payload: {
											id: id,
										},
									});

									notification.add({
										color: "warning",
										message: `Successfully deleted ${id}, please be aware this likely will affect your data notebook.`,
									});

									setAnchorEl(null);
								}}
							>
								<Stack direction="row" alignItems="center">
									<Delete color="error" />
									<StyledErrorTypography variant="body2">
										Delete
									</StyledErrorTypography>
								</Stack>
							</Menu.Item>
						</Menu>
					</Stack>
				}
			>
				<StyledListItemText
					disableTypography
					primary={
						<Stack>
							<StyledTooltip
								placement={"right"}
								title={
									<VariablePreview
										variable={variable}
										id={id}
									/>
								}
								componentsProps={{
									tooltip: {
										sx: {
											bgcolor: "white",
											color: "black",
											padding: "0px",
											maxWidth: "600px",
										},
									},
								}}
								enterDelay={500}
								leaveDelay={200}
							>
								<StyledButton>
									{!openRenameAlias ? (
										<StyledPointerStack
											alignItems="flex-start"
											spacing={0}
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();

												setOpenRenameAlias(true);
											}}
										>
											<Typography
												variant="body1"
												fontWeight="medium"
											>
												{id}
											</Typography>
											<StyledCapitalizedTypography variant="body2">
												{getVariableTypeDisplay}
											</StyledCapitalizedTypography>
										</StyledPointerStack>
									) : (
										<StyledStack
											spacing={1}
											direction="column"
										>
											<StyledTextField
												className="notebook-variable__alias-name-text-field"
												inputRef={(input) =>
													input && input.focus()
												}
												focused={true}
												fullWidth
												size={"small"}
												variant="standard"
												value={newTokenAlias}
												helperText={
													<em>
														Press enter to update
														variable name
													</em>
												}
												onChange={(e) => {
													setNewTokenAlias(
														e.target.value,
													);
												}}
												onKeyDown={async (e) => {
													if (e.key === "Enter") {
														setOpenRenameAlias(
															false,
														);

														const isValidSyntax =
															isValidPythonVariableName(
																newTokenAlias,
															);

														if (!isValidSyntax) {
															notification.add({
																color: "error",
																message: `Unable to rename ${id} to ${newTokenAlias}, due to syntax or a duplicated alias`,
															});
															return;
														}

														const success =
															await state.dispatch(
																{
																	message:
																		ActionMessages.RENAME_VARIABLE,
																	payload: {
																		id: id,
																		alias: newTokenAlias,
																	},
																},
															);

														notification.add({
															color: success
																? "success"
																: "error",
															message: success
																? `Successfully renamed variable ${id} to ${newTokenAlias}, remember to save your app.`
																: `Unable to rename ${id} to ${newTokenAlias}, due to syntax or a duplicated alias`,
														});

														setNewTokenAlias(
															success
																? newTokenAlias
																: id,
														);
													}
												}}
												onBlur={() => {
													setOpenRenameAlias(false);
													setNewTokenAlias(id);
												}}
												InputProps={{
													disableUnderline: true,
												}}
											/>
										</StyledStack>
									)}
									{isPopoverOpen && (
										<StyledEmptyDiv
											onMouseOver={(e) => {
												e.stopPropagation();
												e.preventDefault();
											}}
											onMouseLeave={(e) => {
												e.stopPropagation();
												e.preventDefault();
											}}
										>
											<AddVariablePopover
												variable={{
													...variable,
													id: id,
												}}
												open={isPopoverOpen}
												anchorEl={popoverAnchorEle}
												onClose={() => {
													setPopoverAnchorEl(null);
												}}
												engines={engines}
											/>
										</StyledEmptyDiv>
									)}
								</StyledButton>
							</StyledTooltip>
						</Stack>
					}
				/>
			</StyledListItem>

			{/* Auto-rename Modal */}
			<Modal
				open={isAutoRenameModalOpen}
				onClose={() => setIsAutoRenameModalOpen(false)}
				aria-labelledby="auto-rename-modal"
			>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 500,
						bgcolor: "background.paper",
						borderRadius: 2,
						boxShadow: 24,
						p: 4,
					}}
				>
					<Typography variant="h6" gutterBottom>
						Suggested Variable Name Change
					</Typography>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mb: 3 }}
					>
						Review the suggested variable name change for "{id}".
					</Typography>

					<Box sx={{ mb: 3 }}>
						<Typography variant="body2" color="text.secondary">
							Current name:
						</Typography>
						<Typography
							variant="body1"
							sx={{ fontWeight: "bold", mb: 2 }}
						>
							{id}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Suggested name:
						</Typography>
						<Typography
							variant="body1"
							sx={{ fontWeight: "bold", color: "primary.main" }}
						>
							{suggestedNewName}
						</Typography>
					</Box>

					<Stack
						direction="row"
						spacing={2}
						justifyContent="flex-end"
					>
						<Button
							onClick={() => setIsAutoRenameModalOpen(false)}
							disabled={isProcessing}
						>
							Cancel
						</Button>
						<Button
							variant="contained"
							onClick={handleApplyRename}
							disabled={isProcessing || !suggestedNewName}
						>
							{isProcessing ? "Applying..." : "Apply Change"}
						</Button>
					</Stack>
				</Box>
			</Modal>
		</>
	);
});
