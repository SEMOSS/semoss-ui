import { Copy, MoreVertical, Pencil, Sparkles, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useWorkspace } from "@/hooks";
import { suggestVariableRenames } from "../blocks-workspace/utils";
import { AddVariablePopover } from "./add-variable-popover";
import { RenameVariableDialog } from "./rename-variable-dialog";
import {
	type EnginesByType,
	formatVariableInlineValue,
	VariableIcon,
} from "./variable-icon";
import { VariablePreview } from "./variable-preview";

interface NotebookTokenProps {
	/** Id of the variable */
	id: string;
	/** Variable Value */
	variable: Variable;
	/** Engines loaded in root variable menu */
	engines: EnginesByType;
}

export const NotebookVariable = observer((props: NotebookTokenProps) => {
	const { id, variable, engines } = props;
	const { state } = useBlocks();

	const { workspace } = useWorkspace();

	const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
	const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

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
			const out = JSON.parse(JSON.stringify(state.notebooks));

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

	const constantValueDisplay = formatVariableInlineValue(variable, engines);

	return (
		<>
			<li
				key={id}
				className="group/var flex items-center justify-between py-1 pr-3 pl-6 focus-within:bg-accent/40 hover:bg-accent/40"
			>
				{/* Left: variable info */}
				<Tooltip delayDuration={500}>
					<TooltipTrigger asChild>
						<button
							type="button"
							className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
							onClick={() => {
								setIsRenameDialogOpen(true);
							}}
							data-testid={"notebook-variable-rename-trigger"}
						>
							<VariableIcon
								variable={variable}
								engines={engines}
								className="size-4"
							/>
							<span className="block min-w-0 flex-shrink overflow-hidden text-ellipsis whitespace-nowrap font-normal text-[14px] text-foreground leading-[20px]">
								{id}
							</span>
							{constantValueDisplay !== null && (
								<span
									className="block min-w-0 flex-shrink-[2] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] text-muted-foreground"
									title={constantValueDisplay}
								>
									= {constantValueDisplay}
								</span>
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent
						side="right"
						sideOffset={8}
						arrow={false}
						className="bg-popover p-0 text-popover-foreground shadow-lg"
					>
						<VariablePreview
							variable={variable}
							id={id}
							engines={engines}
						/>
					</TooltipContent>
				</Tooltip>

				{/* Right: actions (hidden until hover/focus) */}
				<div
					className="flex shrink-0 items-center opacity-0 transition-opacity group-focus-within/var:opacity-100 group-hover/var:opacity-100 data-[menu-open=true]:opacity-100"
					data-menu-open={isMenuOpen}
				>
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
					<DropdownMenu onOpenChange={setIsMenuOpen}>
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

			<RenameVariableDialog
				open={isRenameDialogOpen}
				onOpenChange={setIsRenameDialogOpen}
				currentName={id}
			/>

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
