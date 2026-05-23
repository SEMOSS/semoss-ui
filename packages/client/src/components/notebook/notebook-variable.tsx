import { Copy, MoreVertical, Pencil, Sparkles, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { ActionMessages, useBlocks, type Variable } from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useWorkspace } from "@/hooks";
import { suggestVariableRenames } from "../blocks-workspace/utils";
import { AddVariablePopover } from "./add-variable-popover";
import { VariablePreview } from "./variable-preview";

interface NotebookTokenProps {
	/** Id of the variable */
	id: string;
	/** Variable Value */
	variable: Variable;
	/** Engines loaded in root variable menu */
	engines: {
		models: {
			engine_id: string;
			engine_name: string;
			engine_type: string;
			engine_subtype: string;
		}[];
		databases: {
			engine_id: string;
			engine_name: string;
			engine_type: string;
			engine_subtype: string;
		}[];
		storages: {
			engine_id: string;
			engine_name: string;
			engine_type: string;
			engine_subtype: string;
		}[];
		functions: {
			engine_id: string;
			engine_name: string;
			engine_type: string;
			engine_subtype: string;
		}[];
		vectors: {
			engine_id: string;
			engine_name: string;
			engine_type: string;
			engine_subtype: string;
		}[];
	};
}

export const NotebookVariable = observer((props: NotebookTokenProps) => {
	const { id, variable, engines } = props;
	const { state } = useBlocks();

	const { workspace } = useWorkspace();

	const [openRenameAlias, setOpenRenameAlias] = useState(false);
	const [newTokenAlias, setNewTokenAlias] = useState(id);
	const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);

	// Auto-rename state
	const [isAutoRenameModalOpen, setIsAutoRenameModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [suggestedNewName, setSuggestedNewName] = useState<string>("");
	const [suggestedNewNameRecords, setSuggestedNewNameRecords] = useState<
		Record<string, string>
	>({});
	const [isProcessing, setIsProcessing] = useState(false);

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
				toast.warning("No suggestion available for this variable");
			}
		} catch (error) {
			console.error("Error getting suggested changes:", error);
			toast.error("Failed to get variable name suggestion");
		} finally {
			setIsProcessing(false);
		}
	};

	/**
	 * Simple Python variable name validation
	 */
	const isValidPythonVariableName = (name: string): boolean => {
		if (!/^[a-zA-Z_]/.test(name)) return false;
		if (!/^[a-zA-Z0-9_]+$/.test(name)) return false;
		if (name.length === 0) return false;
		return true;
	};

	/**
	 * Apply the suggested rename
	 */
	const handleApplyRename = async () => {
		if (!suggestedNewName) return;

		if (!isValidPythonVariableName(suggestedNewName)) {
			toast.error(
				`Invalid variable name: ${suggestedNewName}. Must start with letter/underscore and contain only letters, numbers, and underscores.`,
			);
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
				toast.success(
					`Successfully renamed variable ${id} to ${suggestedNewName}`,
				);
				setIsAutoRenameModalOpen(false);
				setSuggestedNewName("");
			} else {
				toast.error(`Failed to rename variable ${id}`);
			}
		} catch (error) {
			console.error("Error applying rename:", error);
			toast.error("Error applying variable rename");
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
			toast.success("Successfully copied to clipboard");
		} catch (e) {
			toast.error(e.message);
		}
	};

	/**
	 * Effects/Memos
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — engines shape is stable
	const getVariableTypeDisplay: string = useMemo(() => {
		if (
			variable.type !== "query" &&
			variable.type !== "block" &&
			variable.type !== "cell"
		) {
			const engineId = state.getVariable(variable.to, variable.type);
			const engine = engines[`${variable.type}s`]
				? engines[`${variable.type}s`].find(
						(engineValue) => engineValue.engine_id === engineId,
					)
				: null;
			if (engine) {
				return engine.engine_name;
			} else {
				return variable.type;
			}
		} else {
			return variable.type;
		}
	}, [variable.type, engines, id]);

	return (
		<>
			<li
				key={id}
				className="flex items-center justify-between py-1 pr-3 pl-6"
			>
				{/* Left: variable info */}
				<Tooltip openDelay={500}>
					<TooltipTrigger asChild>
						<button
							type="button"
							className="flex min-w-0 flex-1 cursor-pointer items-start gap-0 text-left"
							onClick={() => {
								setOpenRenameAlias(true);
							}}
						>
							{!openRenameAlias ? (
								<div className="flex min-w-0 flex-1 items-center gap-0">
									<div className="flex min-w-0 flex-1 flex-col items-start">
										<span className="block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-normal text-[#202020] text-[14px] leading-[20px]">
											{id}
										</span>
										<span className="text-muted-foreground text-sm capitalize">
											{getVariableTypeDisplay}
										</span>
									</div>
								</div>
							) : (
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<Input
										className="notebook-variable__alias-name-text-field h-7 rounded-none border-0 border-b px-0 text-sm focus-visible:ring-0"
										// biome-ignore lint/suspicious/noExplicitAny: input ref callback
										ref={(input: any) => input?.focus()}
										value={newTokenAlias}
										onChange={(e) => {
											setNewTokenAlias(e.target.value);
										}}
										data-testid={
											"notebook-variable-rename-input"
										}
										onKeyDown={async (e) => {
											if (e.key === "Enter") {
												setOpenRenameAlias(false);

												const isValidSyntax =
													isValidPythonVariableName(
														newTokenAlias,
													);

												if (!isValidSyntax) {
													toast.error(
														`Unable to rename ${id} to ${newTokenAlias}, due to syntax or a duplicated alias`,
													);
													return;
												}

												const success =
													await state.dispatch({
														message:
															ActionMessages.RENAME_VARIABLE,
														payload: {
															id: id,
															alias: newTokenAlias,
														},
													});

												if (success) {
													toast.success(
														`Successfully renamed variable ${id} to ${newTokenAlias}, remember to save your app.`,
													);
												} else {
													toast.error(
														`Unable to rename ${id} to ${newTokenAlias}, due to syntax or a duplicated alias`,
													);
												}

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
									/>
									<span className="text-muted-foreground text-xs italic">
										Press enter to update variable name
									</span>
								</div>
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent
						side="right"
						sideOffset={8}
						arrow={false}
						className="bg-white p-0 text-foreground shadow-lg"
					>
						<VariablePreview variable={variable} id={id} />
					</TooltipContent>
				</Tooltip>

				{/* Right: actions */}
				<div className="flex shrink-0 items-center">
					<button
						type="button"
						className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
						onClick={() => {
							copyAlias(id);
						}}
						data-testid={"notebook-variable-copy-btn"}
					>
						<Copy className="size-3.5" />
					</button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								title="Open Menu"
								className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
								data-testid={"notebook-variable-more-btn"}
							>
								<MoreVertical className="size-3.5" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							data-testid={"notebook-variable-menu"}
						>
							<DropdownMenuItem
								onClick={() => {
									setIsEditPopoverOpen(true);
								}}
								data-testid={"notebook-variable-edit-menuitem"}
							>
								<Pencil className="size-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									handleAutoRename();
								}}
								disabled={
									isProcessing || !workspace.agentModelEngine
								}
								data-testid={
									"notebook-variable-auto-rename-menuitem"
								}
							>
								<Sparkles className="size-4" />
								{isProcessing ? "Processing..." : "Auto Rename"}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setIsDeleteModalOpen(true);
								}}
								data-testid={
									"notebook-variable-delete-menuitem"
								}
							>
								<Trash2 className="size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</li>

			{/* Delete confirmation dialog */}
			<Dialog
				open={isDeleteModalOpen}
				onOpenChange={(o) => !o && setIsDeleteModalOpen(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Selected Item?</DialogTitle>
					</DialogHeader>
					<p className="text-sm">
						You will permanently remove the item from your
						workspace.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteModalOpen(false)}
							data-testid={"notebook-variable-delete-cancel-btn"}
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
								toast.warning(
									`Successfully deleted ${id}, please be aware this likely will affect your data notebook.`,
								);
								setIsDeleteModalOpen(false);
							}}
							data-testid={"notebook-variable-delete-confirm-btn"}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Auto-rename dialog */}
			<Dialog
				open={isAutoRenameModalOpen}
				onOpenChange={(o) => !o && setIsAutoRenameModalOpen(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Suggested Variable Name Change
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Review the suggested variable name change for "{id}".
					</p>
					<div className="flex flex-col gap-2">
						<div>
							<span className="text-muted-foreground text-sm">
								Current name:
							</span>
							<p className="font-bold">{id}</p>
						</div>
						<div>
							<span className="text-muted-foreground text-sm">
								Suggested name:
							</span>
							<p className="font-bold text-primary">
								{suggestedNewName}
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsAutoRenameModalOpen(false)}
							disabled={isProcessing}
						>
							Cancel
						</Button>
						<Button
							onClick={handleApplyRename}
							disabled={isProcessing || !suggestedNewName}
						>
							{isProcessing ? "Applying..." : "Apply Change"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit variable popover/sheet */}
			{isEditPopoverOpen && (
				<AddVariablePopover
					variable={{ ...variable, id: id }}
					open={isEditPopoverOpen}
					anchorEl={null}
					onClose={() => {
						setIsEditPopoverOpen(false);
					}}
					engines={engines}
				/>
			)}
		</>
	);
});
