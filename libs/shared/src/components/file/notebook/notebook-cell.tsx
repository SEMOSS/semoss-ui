import {
	ArrowDownIcon,
	ArrowDownToLineIcon,
	ArrowUpIcon,
	ArrowUpToLineIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	ChevronsDownIcon,
	ChevronsUpIcon,
	CopyIcon,
	EraserIcon,
	EyeIcon,
	GripVerticalIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlayIcon,
	SquareIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { JupyterCell, JupyterCellType } from "./notebook.types";
import { NotebookCellInput } from "./notebook-cell-input";
import { NotebookCellOutput } from "./notebook-cell-output";

interface NotebookCellProps {
	/** The cell to render. */
	cell: JupyterCell;
	/** Position of this cell in the notebook. */
	index: number;
	/** True while this cell is executing. */
	isRunning: boolean;
	/** Disable actions while the notebook is busy. */
	disabled: boolean;
	/** Whether this cell is the active/focused cell. */
	isActive: boolean;
	/** Whether at least one code cell exists above this one. */
	canRunAbove: boolean;
	/** Whether at least one code cell exists below this one. */
	canRunBelow: boolean;
	/** Run this code cell. */
	onRun: (index: number) => void;
	/** Run and advance focus to the next cell. */
	onRunAndAdvance: (index: number) => void;
	/** Interrupt a running execution. */
	onInterrupt: (index: number) => void;
	/** Run every code cell above this one. */
	onRunAbove: (index: number) => void;
	/** Run every code cell below this one. */
	onRunBelow: (index: number) => void;
	/** Duplicate this cell, inserting the copy below. */
	onDuplicate: (index: number) => void;
	/** Clear outputs for this code cell. */
	onClearOutput: (index: number) => void;
	/** Mark this cell as active. */
	onActivate: (index: number) => void;
	/** Persist an edited cell source. */
	onSourceChange: (index: number, source: string) => void;
	/** Switch this cell to a different type. */
	onChangeType: (index: number, type: JupyterCellType) => void;
	/** Insert a new cell of the given type above this one. */
	onInsertAbove: (index: number, type: JupyterCellType) => void;
	/** Insert a new cell of the given type below this one. */
	onInsertBelow: (index: number, type: JupyterCellType) => void;
	/** Delete this cell. */
	onDelete: (index: number) => void;
	/** Move this cell one position up. */
	onMoveUp: (index: number) => void;
	/** Move this cell one position down. */
	onMoveDown: (index: number) => void;
	/** Whether this cell can move up (not already first). */
	canMoveUp: boolean;
	/** Whether this cell can move down (not already last). */
	canMoveDown: boolean;
	/** dnd-kit drag-handle props applied to the grip (attributes + listeners). */
	dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

/**
 * A single notebook cell: its header (collapse toggle, type select, execution
 * count), its editable body (`NotebookCellInput`), and — for code cells — a
 * collapsible list of `NotebookCellOutput`s. A floating top-right toolbar holds
 * the primary action (Run/Stop for code, Edit/Preview for markdown), Delete, and
 * an ellipsis menu; a right-click context menu mirrors those cell actions.
 */
export const NotebookCell: React.FC<NotebookCellProps> = ({
	cell,
	index,
	isRunning,
	disabled,
	isActive,
	canRunAbove,
	canRunBelow,
	onRun,
	onRunAndAdvance,
	onInterrupt,
	onRunAbove,
	onRunBelow,
	onDuplicate,
	onClearOutput,
	onActivate,
	onSourceChange,
	onChangeType,
	onInsertAbove,
	onInsertBelow,
	onDelete,
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
	dragHandleProps,
}) => {
	// Initialise collapse state from nbformat cell tags (hide-input / hide-output).
	const [inputCollapsed, setInputCollapsed] = useState<boolean>(() => {
		const t = cell.metadata.tags;
		return Array.isArray(t) && (t as string[]).includes("hide-input");
	});
	const [outputsCollapsed, setOutputsCollapsed] = useState<boolean>(() => {
		const t = cell.metadata.tags;
		return Array.isArray(t) && (t as string[]).includes("hide-output");
	});
	const [isEditing, setIsEditing] = useState(false);

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div className="group relative flex gap-1.5">
					{/* Gutter — drag handle + collapse toggle, shown on hover. */}
					<div className="flex shrink-0 flex-row items-start gap-0.5 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
						<div
							title="Drag to reorder"
							className="flex size-5 cursor-grab items-center justify-center text-muted-foreground/60 hover:text-foreground"
							{...dragHandleProps}
						>
							<GripVerticalIcon className="size-4" />
						</div>
						<button
							type="button"
							className="flex size-5 cursor-pointer items-center justify-center rounded text-muted-foreground/60 transition-colors hover:text-foreground"
							onClick={(e) => {
								e.stopPropagation();
								setInputCollapsed((prev) => !prev);
							}}
							aria-label={
								inputCollapsed ? "Expand cell" : "Collapse cell"
							}
						>
							{inputCollapsed ? (
								<ChevronRightIcon className="size-3.5" />
							) : (
								<ChevronDownIcon className="size-3.5" />
							)}
						</button>
					</div>
					{/* Cell content column. */}
					<div className="relative min-w-0 flex-1">
						{/* Toolbar — floats above top-right of cell; revealed on hover, pinned when active. */}
						<div
							className={`-top-3 absolute right-0 z-20 flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5 shadow-sm transition-opacity ${
								isActive
									? "opacity-100"
									: "opacity-0 focus-within:opacity-100 group-hover:opacity-100"
							}`}
						>
							{cell.cell_type === "code" &&
								(isRunning ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												className="size-7 text-destructive hover:text-destructive"
												onClick={(e) => {
													e.stopPropagation();
													onInterrupt(index);
												}}
												aria-label="Stop execution"
											>
												<SquareIcon className="size-3.5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Stop execution
										</TooltipContent>
									</Tooltip>
								) : (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												className="size-7"
												disabled={disabled}
												onClick={(e) => {
													e.stopPropagation();
													onRun(index);
												}}
												aria-label="Run cell"
											>
												<PlayIcon className="size-3.5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Run cell
										</TooltipContent>
									</Tooltip>
								))}
							{cell.cell_type === "markdown" && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											className="size-7"
											onClick={(e) => {
												e.stopPropagation();
												setIsEditing((prev) => !prev);
											}}
											aria-label={
												isEditing
													? "Switch to preview"
													: "Edit markdown"
											}
										>
											{isEditing ? (
												<EyeIcon className="size-3.5" />
											) : (
												<PencilIcon className="size-3.5" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{isEditing
											? "Switch to preview"
											: "Edit markdown"}
									</TooltipContent>
								</Tooltip>
							)}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-7 text-muted-foreground hover:text-destructive"
										disabled={disabled}
										onClick={(e) => {
											e.stopPropagation();
											onDelete(index);
										}}
										aria-label="Delete cell"
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Delete cell</TooltipContent>
							</Tooltip>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-7 text-muted-foreground hover:text-foreground"
										title="More actions"
										onClick={(e) => e.stopPropagation()}
										aria-label="More actions"
									>
										<MoreHorizontalIcon className="size-3.5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-52"
								>
									<DropdownMenuItem
										disabled={disabled}
										onSelect={() =>
											onInsertAbove(index, "code")
										}
									>
										<ArrowUpToLineIcon className="size-4" />
										Insert Cell Above
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={disabled}
										onSelect={() =>
											onInsertBelow(index, "code")
										}
									>
										<ArrowDownToLineIcon className="size-4" />
										Insert Cell Below
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={disabled}
										onSelect={() => onDuplicate(index)}
									>
										<CopyIcon className="size-4" />
										Duplicate Cell
									</DropdownMenuItem>
									{cell.cell_type === "code" &&
										cell.outputs.length > 0 && (
											<DropdownMenuItem
												disabled={disabled}
												onSelect={() =>
													onClearOutput(index)
												}
											>
												<EraserIcon className="size-4" />
												Clear Output
											</DropdownMenuItem>
										)}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										disabled={disabled || !canMoveUp}
										onSelect={() => onMoveUp(index)}
									>
										<ArrowUpIcon className="size-4" />
										Move Cell Up
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={disabled || !canMoveDown}
										onSelect={() => onMoveDown(index)}
									>
										<ArrowDownIcon className="size-4" />
										Move Cell Down
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuSub>
										<DropdownMenuSubTrigger
											disabled={disabled}
										>
											Change Cell Type
										</DropdownMenuSubTrigger>
										<DropdownMenuSubContent>
											<DropdownMenuRadioGroup
												value={cell.cell_type}
												onValueChange={(value) =>
													onChangeType(
														index,
														value as JupyterCellType,
													)
												}
											>
												<DropdownMenuRadioItem value="code">
													Code
												</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="markdown">
													Markdown
												</DropdownMenuRadioItem>
												<DropdownMenuRadioItem value="raw">
													Raw
												</DropdownMenuRadioItem>
											</DropdownMenuRadioGroup>
										</DropdownMenuSubContent>
									</DropdownMenuSub>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										disabled={
											disabled ||
											cell.cell_type !== "code"
										}
										onSelect={() => onRun(index)}
									>
										<PlayIcon className="size-4" />
										Run Cell
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={disabled || !canRunAbove}
										onSelect={() => onRunAbove(index)}
									>
										<ChevronsUpIcon className="size-4" />
										Run Cells Above
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={disabled || !canRunBelow}
										onSelect={() => onRunBelow(index)}
									>
										<ChevronsDownIcon className="size-4" />
										Run Cells Below
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: click anywhere on the cell activates it */}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: click anywhere on the cell activates it */}
						<div
							className={`min-w-0 flex-1 overflow-hidden rounded-md border border-border/60 transition-colors hover:border-border ${
								isActive ? "ring-2 ring-primary/40" : ""
							}`}
							onClick={() => onActivate(index)}
						>
							{inputCollapsed && (
								<div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-xs">
									{cell.cell_type === "code" && (
										<span className="font-mono">
											In [{cell.execution_count ?? " "}]:
										</span>
									)}
									<span className="truncate font-mono">
										{typeof cell.metadata.name ===
											"string" && cell.metadata.name
											? cell.metadata.name
											: cell.cell_type}
									</span>
								</div>
							)}
							{!inputCollapsed && (
								<>
									<NotebookCellInput
										cell={cell}
										isEditing={isEditing}
										onChange={(next) =>
											onSourceChange(index, next)
										}
										onRunInPlace={() => onRun(index)}
										onRunAndAdvance={() =>
											onRunAndAdvance(index)
										}
									/>

									{/* Outputs (code only) */}
									{cell.cell_type === "code" &&
										cell.outputs.length > 0 && (
											<div className="border-border border-t">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setOutputsCollapsed(
															(prev) => !prev,
														);
													}}
													className="flex h-auto w-full items-center justify-start gap-1 rounded-none px-1 py-1.5 font-normal text-muted-foreground text-xs hover:text-foreground"
												>
													{outputsCollapsed ? (
														<ChevronRightIcon className="size-3" />
													) : (
														<ChevronDownIcon className="size-3" />
													)}
													<span>
														{outputsCollapsed
															? `Output (${cell.outputs.length} hidden)`
															: "Output"}
													</span>
												</button>
												{!outputsCollapsed && (
													<div className="flex flex-col gap-1">
														{cell.outputs.map(
															(
																output,
																outputIndex,
															) => (
																<NotebookCellOutput
																	key={`${output.output_type}-${outputIndex}`}
																	output={
																		output
																	}
																/>
															),
														)}
													</div>
												)}
											</div>
										)}
								</>
							)}
						</div>
					</div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-52">
				<ContextMenuItem
					disabled={disabled}
					onSelect={() => onInsertAbove(index, "code")}
				>
					<ArrowUpToLineIcon className="size-4" />
					Insert Cell Above
				</ContextMenuItem>
				<ContextMenuItem
					disabled={disabled}
					onSelect={() => onInsertBelow(index, "code")}
				>
					<ArrowDownToLineIcon className="size-4" />
					Insert Cell Below
				</ContextMenuItem>
				<ContextMenuItem
					disabled={disabled}
					onSelect={() => onDuplicate(index)}
				>
					<CopyIcon className="size-4" />
					Duplicate Cell
				</ContextMenuItem>
				{cell.cell_type === "code" && cell.outputs.length > 0 && (
					<ContextMenuItem
						disabled={disabled}
						onSelect={() => onClearOutput(index)}
					>
						<EraserIcon className="size-4" />
						Clear Output
					</ContextMenuItem>
				)}
				<ContextMenuSeparator />
				<ContextMenuSub>
					<ContextMenuSubTrigger disabled={disabled}>
						Change Cell Type
					</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						<ContextMenuRadioGroup
							value={cell.cell_type}
							onValueChange={(value) =>
								onChangeType(index, value as JupyterCellType)
							}
						>
							<ContextMenuRadioItem value="code">
								Code
							</ContextMenuRadioItem>
							<ContextMenuRadioItem value="markdown">
								Markdown
							</ContextMenuRadioItem>
							<ContextMenuRadioItem value="raw">
								Raw
							</ContextMenuRadioItem>
						</ContextMenuRadioGroup>
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSeparator />
				<ContextMenuItem
					disabled={disabled || cell.cell_type !== "code"}
					onSelect={() => onRun(index)}
				>
					<PlayIcon className="size-4" />
					Run Cell
				</ContextMenuItem>
				<ContextMenuItem
					disabled={disabled || !canRunAbove}
					onSelect={() => onRunAbove(index)}
				>
					<ChevronsUpIcon className="size-4" />
					Run Cells Above
				</ContextMenuItem>
				<ContextMenuItem
					disabled={disabled || !canRunBelow}
					onSelect={() => onRunBelow(index)}
				>
					<ChevronsDownIcon className="size-4" />
					Run Cells Below
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
