import {
	ArrowDownToLineIcon,
	ArrowUpToLineIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	ChevronsDownIcon,
	ChevronsUpIcon,
	CopyIcon,
	EraserIcon,
	EyeIcon,
	PencilIcon,
	PlayIcon,
	SquareIcon,
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
} from "@semoss/ui/next";
import type { JupyterCell, JupyterCellType } from "./notebook.types";
import { NotebookCellInput } from "./notebook-cell-input";
import { NotebookCellOutput } from "./notebook-cell-output";
import { NotebookCellTypeSelect } from "./notebook-cell-type-select";

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
}

/**
 * A single notebook cell: its header (type select, plus a Run button for code or
 * an Edit/Preview toggle for markdown), its editable body (`NotebookCellInput`),
 * and — for code cells — a collapsible list of `NotebookCellOutput`s. A
 * right-click context menu offers insert / change-type / run actions.
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
				{/* biome-ignore lint/a11y/noStaticElementInteractions: click anywhere on the cell activates it */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: click anywhere on the cell activates it */}
				<div
					className={`min-w-0 flex-1 overflow-hidden rounded-md border ${isActive ? "border-primary" : "border-border"}`}
					onClick={() => onActivate(index)}
				>
					{/* Header */}
					<div className="flex items-center justify-between gap-2 border-border border-b bg-muted/40 px-3 py-1.5">
						<div className="flex items-center gap-2">
							{/* Input collapse toggle */}
							<Button
								variant="ghost"
								size="icon-sm"
								className="size-5 shrink-0 text-muted-foreground/60 hover:text-foreground"
								onClick={(e) => {
									e.stopPropagation();
									setInputCollapsed((prev) => !prev);
								}}
								title={
									inputCollapsed
										? "Show cell input"
										: "Hide cell input"
								}
								aria-label={
									inputCollapsed
										? "Show cell input"
										: "Hide cell input"
								}
							>
								{inputCollapsed ? (
									<ChevronRightIcon className="size-3" />
								) : (
									<ChevronDownIcon className="size-3" />
								)}
							</Button>
							<NotebookCellTypeSelect
								value={cell.cell_type}
								disabled={disabled}
								onChange={(type) => onChangeType(index, type)}
							/>
							{cell.cell_type === "code" && (
								<span className="font-mono text-muted-foreground text-xs">
									In [{cell.execution_count ?? " "}]
								</span>
							)}
						</div>
						{cell.cell_type === "code" &&
							(isRunning ? (
								<Button
									variant="outline"
									size="sm"
									className="h-7 gap-1 px-2 text-destructive text-xs hover:text-destructive"
									onClick={(e) => {
										e.stopPropagation();
										onInterrupt(index);
									}}
								>
									<SquareIcon className="size-3.5" />
									Stop
								</Button>
							) : (
								<Button
									variant="outline"
									size="sm"
									className="h-7 gap-1 px-2 text-xs"
									disabled={disabled}
									onClick={(e) => {
										e.stopPropagation();
										onRun(index);
									}}
								>
									<PlayIcon className="size-3.5" />
									Run
								</Button>
							))}
						{cell.cell_type === "markdown" && (
							<Button
								variant="outline"
								size="sm"
								className="h-7 gap-1 px-2 text-xs"
								onClick={(e) => {
									e.stopPropagation();
									setIsEditing((prev) => !prev);
								}}
							>
								{isEditing ? (
									<>
										<EyeIcon className="size-3.5" />
										Preview
									</>
								) : (
									<>
										<PencilIcon className="size-3.5" />
										Edit
									</>
								)}
							</Button>
						)}
					</div>

					{/* Body — hidden when input is collapsed */}
					{!inputCollapsed && (
						<>
							<NotebookCellInput
								cell={cell}
								isEditing={isEditing}
								onChange={(next) => onSourceChange(index, next)}
								onRunInPlace={() => onRun(index)}
								onRunAndAdvance={() => onRunAndAdvance(index)}
							/>

							{/* Outputs (code only) */}
							{cell.cell_type === "code" &&
								cell.outputs.length > 0 && (
									<div className="border-border border-t">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												setOutputsCollapsed(
													(prev) => !prev,
												);
											}}
											className="h-auto w-full justify-start gap-1 rounded-none px-3 py-1.5 font-normal text-muted-foreground text-xs hover:text-foreground"
										>
											{outputsCollapsed ? (
												<ChevronRightIcon className="size-3.5" />
											) : (
												<ChevronDownIcon className="size-3.5" />
											)}
											<span>
												{outputsCollapsed
													? `Output (${cell.outputs.length} hidden)`
													: "Output"}
											</span>
										</Button>
										{!outputsCollapsed && (
											<div className="flex flex-col gap-2 px-3 pb-3">
												{cell.outputs.map(
													(output, outputIndex) => (
														<NotebookCellOutput
															key={`${output.output_type}-${outputIndex}`}
															output={output}
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
					disabled={disabled || !canRunAbove}
					onSelect={() => onRunAbove(index)}
				>
					<ChevronsUpIcon className="size-4" />
					Execute Cells Above
				</ContextMenuItem>
				<ContextMenuItem
					disabled={disabled || !canRunBelow}
					onSelect={() => onRunBelow(index)}
				>
					<ChevronsDownIcon className="size-4" />
					Execute Cells Below
				</ContextMenuItem>
				<ContextMenuItem
					disabled={disabled || cell.cell_type !== "code"}
					onSelect={() => onRun(index)}
				>
					<PlayIcon className="size-4" />
					Run Cell
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
