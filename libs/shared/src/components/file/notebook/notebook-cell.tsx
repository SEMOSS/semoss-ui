import {
	ArrowDownIcon,
	ArrowDownToLineIcon,
	ArrowUpIcon,
	ArrowUpToLineIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	CopyIcon,
	GripVerticalIcon,
	MoreHorizontalIcon,
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

/** A type-specific cell action rendered in both the ellipsis and context menus. */
export interface NotebookCellAction {
	/** Stable key. */
	id: string;
	/** Menu label. */
	label: string;
	/** Leading icon. */
	icon: React.ReactNode;
	/** Invoked when the item is selected. */
	onSelect: () => void;
	/** Disable the item. */
	disabled?: boolean;
}

/** Chrome/menu props shared by every cell-type component and forwarded to the frame. */
export interface NotebookCellBaseProps {
	/** Position of this cell in the notebook. */
	index: number;
	/** Disable actions while the notebook is busy. */
	disabled: boolean;
	/** Whether this cell is the active/focused cell. */
	isActive: boolean;
	/** Mark this cell as active. */
	onActivate: (index: number) => void;
	/** Switch this cell to a different type. */
	onChangeType: (index: number, type: JupyterCellType) => void;
	/** Insert a new cell of the given type above this one. */
	onInsertAbove: (index: number, type: JupyterCellType) => void;
	/** Insert a new cell of the given type below this one. */
	onInsertBelow: (index: number, type: JupyterCellType) => void;
	/** Duplicate this cell, inserting the copy below. */
	onDuplicate: (index: number) => void;
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

interface NotebookCellProps extends NotebookCellBaseProps {
	/** The cell to render. */
	cell: JupyterCell;
	/** Type-specific primary toolbar control (Run/Stop, Edit/Preview). */
	primaryAction?: React.ReactNode;
	/** Type-specific menu actions appended to both menus. */
	actions?: NotebookCellAction[];
	/** The cell body (editor / preview / outputs). */
	children: React.ReactNode;
}

const CELL_TYPES: { value: JupyterCellType; label: string }[] = [
	{ value: "code", label: "Code" },
	{ value: "markdown", label: "Markdown" },
	{ value: "raw", label: "Raw" },
];

/**
 * Positioning + chrome frame shared by every cell type: the drag/collapse
 * gutter, the floating top-right toolbar (a `primaryAction` slot, Delete, and an
 * ellipsis menu), the whole-cell right-click menu, and the active-ring content
 * column that renders the type-specific `children`. Structural actions (insert /
 * duplicate / move / change type) plus the type-specific `actions` are declared
 * once and rendered into both menus so they never drift apart.
 */
export const NotebookCell: React.FC<NotebookCellProps> = ({
	cell,
	index,
	disabled,
	isActive,
	onActivate,
	onChangeType,
	onInsertAbove,
	onInsertBelow,
	onDuplicate,
	onDelete,
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
	dragHandleProps,
	primaryAction,
	actions,
	children,
}) => {
	// Initialise collapse state from the nbformat hide-input cell tag.
	const [inputCollapsed, setInputCollapsed] = useState<boolean>(() => {
		const tags = cell.metadata.tags;
		return Array.isArray(tags) && (tags as string[]).includes("hide-input");
	});

	// Structural items shared by both menus; declared once so they stay in sync.
	const structuralActions: NotebookCellAction[] = [
		{
			id: "insert-above",
			label: "Insert Cell Above",
			icon: <ArrowUpToLineIcon className="size-4" />,
			onSelect: () => onInsertAbove(index, "code"),
			disabled,
		},
		{
			id: "insert-below",
			label: "Insert Cell Below",
			icon: <ArrowDownToLineIcon className="size-4" />,
			onSelect: () => onInsertBelow(index, "code"),
			disabled,
		},
		{
			id: "duplicate",
			label: "Duplicate Cell",
			icon: <CopyIcon className="size-4" />,
			onSelect: () => onDuplicate(index),
			disabled,
		},
	];

	const moveActions: NotebookCellAction[] = [
		{
			id: "move-up",
			label: "Move Cell Up",
			icon: <ArrowUpIcon className="size-4" />,
			onSelect: () => onMoveUp(index),
			disabled: disabled || !canMoveUp,
		},
		{
			id: "move-down",
			label: "Move Cell Down",
			icon: <ArrowDownIcon className="size-4" />,
			onSelect: () => onMoveDown(index),
			disabled: disabled || !canMoveDown,
		},
	];

	const typeActions = actions ?? [];

	// The dropdown and context menus share these items (different item widgets).
	const dropdownItems = (
		<>
			{structuralActions.map((action) => (
				<DropdownMenuItem
					key={action.id}
					disabled={action.disabled}
					onSelect={action.onSelect}
				>
					{action.icon}
					{action.label}
				</DropdownMenuItem>
			))}
			<DropdownMenuSeparator />
			{moveActions.map((action) => (
				<DropdownMenuItem
					key={action.id}
					disabled={action.disabled}
					onSelect={action.onSelect}
				>
					{action.icon}
					{action.label}
				</DropdownMenuItem>
			))}
			<DropdownMenuSeparator />
			<DropdownMenuSub>
				<DropdownMenuSubTrigger disabled={disabled}>
					Change Cell Type
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent>
					<DropdownMenuRadioGroup
						value={cell.cell_type}
						onValueChange={(value) =>
							onChangeType(index, value as JupyterCellType)
						}
					>
						{CELL_TYPES.map((type) => (
							<DropdownMenuRadioItem
								key={type.value}
								value={type.value}
							>
								{type.label}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuSubContent>
			</DropdownMenuSub>
			{typeActions.length > 0 && <DropdownMenuSeparator />}
			{typeActions.map((action) => (
				<DropdownMenuItem
					key={action.id}
					disabled={action.disabled}
					onSelect={action.onSelect}
				>
					{action.icon}
					{action.label}
				</DropdownMenuItem>
			))}
		</>
	);

	const contextItems = (
		<>
			{structuralActions.map((action) => (
				<ContextMenuItem
					key={action.id}
					disabled={action.disabled}
					onSelect={action.onSelect}
				>
					{action.icon}
					{action.label}
				</ContextMenuItem>
			))}
			<ContextMenuSeparator />
			{moveActions.map((action) => (
				<ContextMenuItem
					key={action.id}
					disabled={action.disabled}
					onSelect={action.onSelect}
				>
					{action.icon}
					{action.label}
				</ContextMenuItem>
			))}
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
						{CELL_TYPES.map((type) => (
							<ContextMenuRadioItem
								key={type.value}
								value={type.value}
							>
								{type.label}
							</ContextMenuRadioItem>
						))}
					</ContextMenuRadioGroup>
				</ContextMenuSubContent>
			</ContextMenuSub>
			{typeActions.length > 0 && <ContextMenuSeparator />}
			{typeActions.map((action) => (
				<ContextMenuItem
					key={action.id}
					disabled={action.disabled}
					onSelect={action.onSelect}
				>
					{action.icon}
					{action.label}
				</ContextMenuItem>
			))}
		</>
	);

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
						{/* Toolbar — floats above top-right; revealed on hover, pinned when active. */}
						<div
							className={`-top-3 absolute right-0 z-20 flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5 shadow-sm transition-opacity ${
								isActive
									? "opacity-100"
									: "opacity-0 focus-within:opacity-100 group-hover:opacity-100"
							}`}
						>
							{primaryAction}
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
									{dropdownItems}
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
							{inputCollapsed ? (
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
							) : (
								children
							)}
						</div>
					</div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-52">
				{contextItems}
			</ContextMenuContent>
		</ContextMenu>
	);
};
