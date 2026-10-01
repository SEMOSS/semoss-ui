import {
	Copy,
	Eye,
	MoreVertical,
	Pencil,
	Sparkles,
	Trash2,
} from "lucide-react";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
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
				className="group/var mx-1 flex min-h-7 items-center justify-between gap-2 rounded-md py-1 pr-2 pl-6 transition-colors focus-within:bg-muted hover:bg-muted"
			>
				{/* Left: variable info */}
				<Tooltip disableHoverableContent={false} delayDuration={500}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							type="button"
							className="h-auto min-w-0 flex-1 justify-start gap-2 p-0 text-left hover:bg-transparent"
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
							<span className="block min-w-0 flex-shrink truncate font-normal text-foreground text-sm">
								{id}
							</span>
							{constantValueDisplay !== null && (
								<span
									className="block min-w-0 flex-shrink-[2] truncate font-mono text-muted-foreground text-xs"
									title={constantValueDisplay}
								>
									= {constantValueDisplay}
								</span>
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>{`Rename variable ${id}`}</TooltipContent>
				</Tooltip>

				{/* Right: actions (hidden until hover/focus) */}
				<div
					className="flex shrink-0 items-center transition-opacity group-focus-within/var:opacity-100 group-hover/var:opacity-100 data-[menu-open=true]:opacity-100 [@media(hover:hover)]:opacity-0"
					data-menu-open={isMenuOpen}
				>
					<Popover>
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-7"
										aria-label={`Preview variable ${id}`}
									>
										<Eye aria-hidden className="size-3.5" />
									</Button>
								</PopoverTrigger>
							</TooltipTrigger>
							<TooltipContent>Preview variable</TooltipContent>
						</Tooltip>
						<PopoverContent
							side="right"
							align="start"
							className="w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0"
							aria-label={`Preview variable ${id}`}
						>
							<VariablePreview
								variable={variable}
								id={id}
								engines={engines}
							/>
						</PopoverContent>
					</Popover>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="size-7 text-muted-foreground hover:text-foreground"
								aria-label={`Copy variable ${id}`}
								onClick={() => copyAlias(id)}
								data-testid="notebook-variable-copy-btn"
							>
								<Copy aria-hidden className="size-3.5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Copy variable</TooltipContent>
					</Tooltip>

					<DropdownMenu onOpenChange={setIsMenuOpen}>
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={`Actions for variable ${id}`}
										type="button"
										className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
										data-testid={
											"notebook-variable-more-btn"
										}
									>
										<MoreVertical className="size-3.5" />
									</Button>
								</DropdownMenuTrigger>
							</TooltipTrigger>
							<TooltipContent
								sideOffset={4}
								className="max-w-xs break-words"
							>{`Actions for variable ${id}`}</TooltipContent>
						</Tooltip>
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
				<DialogContent aria-describedby={undefined}>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Delete Selected Item?
						</DialogTitle>
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
				<DialogContent aria-describedby={undefined}>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
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
