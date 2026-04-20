import {
	Wand2 as AutoFixHighOutlined,
	Copy as ContentCopy,
	MoreVertical as MoreVert,
} from "lucide-react";
import { Trash2 as DeleteOutlineOutlinedIcon } from "lucide-react";
import { Pencil as EditOutlinedIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { ActionMessages, useBlocks, type Variable } from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Popover,
	PopoverAnchor,
	PopoverContent,
	toast,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkspace } from "@/hooks";
import VariableArray from "../../assets/img/VariableArray.svg";
import VariableBlock from "../../assets/img/VariableBlock.svg";
import VariableBrain from "../../assets/img/VariableBrain.png";
import VariableCell from "../../assets/img/VariableCell.svg";
import VariableDatabase from "../../assets/img/VariableDatabase.svg";
import VariableDate from "../../assets/img/VariableDate.svg";
import VariableFunction from "../../assets/img/VariableFunction.svg";
import VariableJSON from "../../assets/img/VariableJSON.svg";
import VariableNumber from "../../assets/img/VariableNumber.svg";
import VariableQuery from "../../assets/img/VariableQuery.svg";
import VariableStorage from "../../assets/img/VariableStorage.svg";
import VariableString from "../../assets/img/VariableString.svg";
import VariableVector from "../../assets/img/VariableVector.svg";
import { suggestVariableRenames } from "../blocks-workspace/utils";
import { AddVariablePopover } from "./AddVariablePopover";
import { VariablePreview } from "./VariablePreview";

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

	// notification-compatible wrapper for toast
	const notification = {
		add: ({ color, message }: { color: string; message: string }) => {
			if (color === "success") toast.success(message);
			else if (color === "error") toast.error(message);
			else if (color === "warning") toast.warning(message);
			else toast(message);
		},
	};

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

	const [isOpen, setIsOpen] = useState<boolean>(false);

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

	const getImage = (type: string) => {
		if (type === "block") {
			return VariableBlock;
		} else if (type === "cell") {
			return VariableCell;
		} else if (type === "query") {
			return VariableQuery;
		} else if (type === "string") {
			return VariableString;
		} else if (type === "number") {
			return VariableNumber;
		} else if (type === "database") {
			return VariableDatabase;
		} else if (type === "model") {
			return VariableBrain;
		} else if (type === "vector") {
			return VariableVector;
		} else if (type === "storage") {
			return VariableStorage;
		} else if (type === "function") {
			return VariableFunction;
		} else if (type === "JSON") {
			return VariableJSON;
		} else if (type === "date") {
			return VariableDate;
		} else {
			return VariableArray;
		}
	};

	return (
		<>
			<div className="px-4 py-1 flex items-center" key={id}>
				<div className="flex-1 cursor-pointer">
					<TooltipProvider delayDuration={500}>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="border-none bg-transparent p-0 m-0 outline-none w-full flex cursor-pointer"
								>
									{!openRenameAlias ? (
										<div
											className="w-4/5 pl-5 cursor-pointer flex flex-col items-start"
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												setOpenRenameAlias(true);
											}}
										>
											<div className="flex flex-row">
												<div className="flex items-center w-6">
													<img
														src={getImage(variable.type)}
														alt="variable-type-icon"
													/>
												</div>
												<div className="h-[42px] w-[128px] flex flex-col items-start">
													<span className="inline-block min-w-0 max-w-[128px] flex-shrink overflow-hidden text-ellipsis whitespace-nowrap font-normal text-[#202020] text-[14px] leading-[20px]">
														{id.length > 12
															? `${id.slice(0, 12)}…`
															: id}
													</span>
													<span
														style={{
															textTransform: "capitalize",
															color: "#666",
															fontFamily: "Inter",
															fontWeight: 400,
															fontSize: "14px",
															lineHeight: "150%",
															letterSpacing: "0.17px",
														}}
													>
														{getVariableTypeDisplay}
													</span>
												</div>
											</div>
										</div>
									) : (
										<div className="pl-5 w-[128px] flex flex-col gap-2">
											<Input
												className="notebook-variable__alias-name-text-field p-0 border-none border-b focus-visible:ring-0 rounded-none"
												ref={(input: HTMLInputElement) => input && input.focus()}
												autoFocus
												value={newTokenAlias}
												onChange={(e) => {
													setNewTokenAlias(e.target.value);
												}}
												data-testid="notebook-variable-rename-input"
												onKeyDown={async (e) => {
													if (e.key === "Enter") {
														setOpenRenameAlias(false);
														const isValidSyntax = isValidPythonVariableName(newTokenAlias);
														if (!isValidSyntax) {
															notification.add({
																color: "error",
																message: `Unable to rename ${id} to ${newTokenAlias}, due to syntax or a duplicated alias`,
															});
															return;
														}
														const success = await state.dispatch({
															message: ActionMessages.RENAME_VARIABLE,
															payload: {
																id: id,
																alias: newTokenAlias,
															},
														});
														notification.add({
															color: success ? "success" : "error",
															message: success
																? `Successfully renamed variable ${id} to ${newTokenAlias}, remember to save your app.`
																: `Unable to rename ${id} to ${newTokenAlias}, due to syntax or a duplicated alias`,
														});
														setNewTokenAlias(success ? newTokenAlias : id);
													}
												}}
												onBlur={() => {
													setOpenRenameAlias(false);
													setNewTokenAlias(id);
												}}
												style={{
													fontWeight: 400,
													fontSize: "14px",
													color: "#212121",
												}}
											/>
											<em className="text-xs text-muted-foreground">
												Press enter to update variable name
											</em>
										</div>
									)}
									{isPopoverOpen && (
										<div
											className="p-0"
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
										</div>
									)}
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="right"
								className="bg-white text-black p-0 max-w-[600px] border-0 shadow-lg"
							>
								<VariablePreview variable={variable} id={id} />
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>

				{/* Secondary actions */}
				<Popover
					open={Boolean(anchorEl)}
					onOpenChange={(isOpen) => { if (!isOpen) setAnchorEl(null); }}
				>
					<div className="h-10 w-20 flex flex-row gap-2 items-center py-2">
						<button
							type="button"
							className="w-10 flex items-center justify-center text-[#757575] hover:bg-accent rounded p-1 cursor-pointer border-none bg-transparent"
							onClick={() => {
								copyAlias(id);
								setAnchorEl(null);
							}}
							data-testid="notebook-variable-copy-btn"
						>
							<ContentCopy className="h-4 w-4" />
						</button>
						<PopoverAnchor asChild>
							<button
								type="button"
								title="Open Menu"
								className="w-10 flex items-center justify-center text-[#757575] hover:bg-accent rounded p-1 cursor-pointer border-none bg-transparent"
								onClick={(e) => {
									e.preventDefault();
									setAnchorEl(e.currentTarget);
								}}
								data-testid="notebook-variable-more-btn"
							>
								<MoreVert className="h-4 w-4" />
							</button>
						</PopoverAnchor>
						<span className="absolute" style={{ left: 100 }} ref={spanRef} />
					</div>
					<PopoverContent
						align="end"
						className="w-auto p-2 rounded shadow-lg"
						data-testid="notebook-variable-menu"
					>
						<button
							type="button"
							className="flex items-center gap-2 w-full px-4 py-1.5 h-9 hover:bg-[#EBF4FE] rounded cursor-pointer border-none bg-transparent text-left"
							onClick={() => {
								setPopoverAnchorEl(spanRef.current);
								setAnchorEl(null);
							}}
							data-testid="notebook-variable-edit-menuitem"
						>
							<EditOutlinedIcon className="h-5 w-5 text-[#757575]" />
							<span style={{ color: "#212121", fontSize: "16px", fontWeight: 400, lineHeight: "150%", letterSpacing: "0.15px" }}>
								Edit
							</span>
						</button>
						<button
							type="button"
							className="flex items-center gap-2 w-full px-4 py-1.5 h-9 hover:bg-[#EBF4FE] rounded cursor-pointer border-none bg-transparent text-left disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => {
								handleAutoRename();
								setAnchorEl(null);
							}}
							data-testid="notebook-variable-auto-rename-menuitem"
							disabled={isProcessing || !workspace.agentModelEngine}
						>
							<AutoFixHighOutlined className="h-5 w-5 text-primary" />
							<span style={{ color: "#212121", fontSize: "16px", fontWeight: 400, lineHeight: "150%", letterSpacing: "0.15px" }}>
								{isProcessing ? "Processing..." : "Auto Rename"}
							</span>
						</button>
						<button
							type="button"
							className="flex items-center gap-2 w-full px-4 py-1.5 h-9 hover:bg-[#EBF4FE] rounded cursor-pointer border-none bg-transparent text-left"
							onClick={() => {
								setIsOpen(true);
								setAnchorEl(null);
							}}
							data-testid="notebook-variable-delete-menuitem"
						>
							<DeleteOutlineOutlinedIcon className="h-5 w-5 text-[#757575]" />
							<span style={{ color: "#212121", fontSize: "16px", fontWeight: 400, lineHeight: "150%", letterSpacing: "0.15px" }}>
								Delete
							</span>
						</button>
					</PopoverContent>
				</Popover>
			</div>

			{/* Delete confirmation dialog */}
			<Dialog open={isOpen} onOpenChange={(o) => { if (!o) setIsOpen(false); }}>
				<DialogContent className="max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Delete Selected Item?</DialogTitle>
					</DialogHeader>
					<p style={{ fontSize: "16px", fontWeight: 400, color: "#212121", lineHeight: "150%", letterSpacing: "0.15px" }}>
						You will permanently remove the item from your workspace.
					</p>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setIsOpen(false)}
							data-testid="notebook-variable-delete-cancel-btn"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
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
								setIsOpen(false);
							}}
							data-testid="notebook-variable-delete-confirm-btn"
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Auto-rename dialog */}
			<Dialog
				open={isAutoRenameModalOpen}
				onOpenChange={(o) => { if (!o) setIsAutoRenameModalOpen(false); }}
			>
				<DialogContent className="max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Suggested Variable Name Change</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground mb-3">
						Review the suggested variable name change for "{id}".
					</p>
					<div className="mb-3 space-y-2">
						<div>
							<p className="text-sm text-muted-foreground">Current name:</p>
							<p className="font-bold">{id}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Suggested name:</p>
							<p className="font-bold text-primary">{suggestedNewName}</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setIsAutoRenameModalOpen(false)}
							disabled={isProcessing}
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={handleApplyRename}
							disabled={isProcessing || !suggestedNewName}
						>
							{isProcessing ? "Applying..." : "Apply Change"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
