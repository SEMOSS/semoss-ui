import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import React, {
	createContext,
	type ReactNode,
	useContext,
	useState,
} from "react";
import { cn } from "@/lib/utils";

export type TreeViewBaseItem<
	R extends {} = {
		id: string;
		label: string;
	},
> = R & {
	children?: TreeViewBaseItem<R>[];
};

interface TreeViewSelectionContextProps {
	selectedItems?: string[] | string | undefined;
	/**
	 * Callback fired when tree items are selected/unselected.
	 * @param {React.SyntheticEvent} event The event source of the callback
	 * @param {string[] | string} nodeIds Ids of the selected nodes. When `multiSelect` is true
	 * this is an array of strings; when false (default) a string.
	 */
	onNodeSelect?: (event: React.SyntheticEvent, nodeIds: string[]) => void;
	multiSelect?: boolean;
	lastClickedId?: string | null;
	setLastClickedId?: (id: string | null) => void;
	nodesInOrder?: string[];
	disableSelection?: boolean;
}

interface TreeExpandContextProps {
	expandedItems?: string[];
	/**
	 * Callback fired when tree items are expanded/collapsed.
	 * @param {React.SyntheticEvent} event The event source of the callback.
	 * @param {array} nodeIds The ids of the expanded nodes.
	 */
	onNodeToggle?: (event: React.SyntheticEvent, nodeIds: string[]) => void;
}

const TreeExpandContext = createContext<TreeExpandContextProps>({});
const TreeViewSelectionContext =
	React.createContext<TreeViewSelectionContextProps>({});

export interface TreeViewProps {
	/**
	 * The content of the component.
	 */
	children?: React.ReactNode;
	className?: string;
	/**
	 * Expanded node ids.
	 * Used when the item's expansion are not controlled.
	 * @default []
	 */
	defaultExpanded?: string[];
	/**
	 * If `true` selection is disabled.
	 * @default false
	 */
	disableSelection?: boolean;
	/**
	 * Expanded node ids.
	 * Used when the item's expansion are controlled.
	 */
	expanded?: string[];
	/**
	 * This prop is used to help implement the accessibility logic.
	 * If you don't provide this prop. It falls back to a randomly generated id.
	 */
	id?: string;
	/**
	 * If true `ctrl` and `shift` will trigger multiselect.
	 * @default false
	 */
	multiSelect?: true;
	/**
	 * Callback fired when tree items are selected/unselected.
	 * @param {React.SyntheticEvent} event The event source of the callback
	 * @param {string[] | string} nodeIds Ids of the selected nodes. When `multiSelect` is true
	 * this is an array of strings; when false (default) a string.
	 */
	onNodeSelect?: (event: React.SyntheticEvent, nodeIds: string[]) => void;
	/**
	 * Callback fired when tree items are expanded/collapsed.
	 * @param {React.SyntheticEvent} event The event source of the callback.
	 * @param {array} nodeIds The ids of the expanded nodes.
	 */
	onNodeToggle?: (event: React.SyntheticEvent, nodeIds: string[]) => void;
	/**
	 * Selected node ids. (Controlled)
	 * When `multiSelect` is true this takes an array of strings; when false (default) a string.
	 */
	selected?: string[];
	/**
	 * The system prop that allows defining system overrides as well as additional CSS styles.
	 */
	style?: React.CSSProperties;
}

const TreeView: React.FC<TreeViewProps> = ({
	id,
	children,
	className,
	defaultExpanded,
	disableSelection,
	expanded,
	multiSelect = false,
	onNodeSelect,
	onNodeToggle,
	selected,
	...otherProps
}) => {
	const isSelectControlled = selected !== undefined && selected !== null;
	const [localSelected, setLocalSelected] = useState<string[]>([]);
	const isExpansionControlled =
		expanded !== undefined &&
		expanded !== null &&
		typeof onNodeToggle === "function";
	const [expandedIds, setExpandedIds] = useState(defaultExpanded || []);
	const [lastClickedId, setLastClickedId] = useState<string | null>(null);

	return (
		<TreeViewSelectionContext.Provider
			value={{
				selectedItems: isSelectControlled ? selected : localSelected,
				onNodeSelect: isSelectControlled
					? onNodeSelect
					: (_event, ids) => {
							setLocalSelected(ids);
						},
				multiSelect,
				disableSelection,
				lastClickedId,
				setLastClickedId,
				nodesInOrder: React.Children.map(children, (child) =>
					React.isValidElement(child) ? child.props.id : null,
				).filter(Boolean),
			}}
		>
			<TreeExpandContext.Provider
				value={{
					expandedItems: isExpansionControlled
						? expanded
						: expandedIds,
					onNodeToggle: isExpansionControlled
						? onNodeToggle
						: (_event, nextExpandedIds) => {
								setExpandedIds(nextExpandedIds);
							},
				}}
			>
				<div
					role="tree"
					className={cn("m-0 list-none p-0", className)}
					tabIndex={0}
					id={id}
					{...otherProps}
				>
					{children}
				</div>
			</TreeExpandContext.Provider>
		</TreeViewSelectionContext.Provider>
	);
};

export type TreeItemProps = {
	label: ReactNode;
	id: string;
	children?: ReactNode;
	className?: string;
	onClick?: (event: React.SyntheticEvent | null) => void;
} & React.HTMLAttributes<HTMLLIElement>;

const TreeItem = React.forwardRef<HTMLLIElement, TreeItemProps>(
	({ label, children, className, id, onClick, ...otherProps }, ref) => {
		// Handles expansion
		const expandCtx = useContext(TreeExpandContext);
		const isExpanded = expandCtx.expandedItems.includes(id);
		const onToggleExpand = (event) => {
			const prevExpanded = expandCtx.expandedItems || [];
			const nextExpanded = isExpanded
				? prevExpanded.filter((x) => x !== id)
				: [...prevExpanded, id];
			expandCtx.onNodeToggle(event, nextExpanded);
		};

		const hasChildren = React.Children.count(children) > 0;

		// Handles Checkbox Selection
		const selectCtx = useContext(TreeViewSelectionContext);
		const selectedIds = Array.isArray(selectCtx.selectedItems)
			? selectCtx.selectedItems
			: [selectCtx.selectedItems];

		const isSelected = selectedIds.includes(id);

		const handleSelection = (event) => {
			event.stopPropagation();
			// handle onClick if provided
			if (typeof onClick === "function") {
				onClick(event);
			}
			selectCtx.setLastClickedId(id);
			// handle expansion if has children
			hasChildren && onToggleExpand(event);
			if (selectCtx.disableSelection) {
				return;
			}

			const isCtrl = event.ctrlKey || event.metaKey; // metaKey for Mac
			const isShift = event.shiftKey;
			const lastSelectedId = selectCtx.lastClickedId;
			const nodesInOrder = selectCtx.nodesInOrder || [];
			let nextSelected: string[];

			// If multi-select, toggle this id in the selected list
			if (selectCtx.multiSelect) {
				if (isShift && lastSelectedId) {
					const start = nodesInOrder.indexOf(lastSelectedId);
					const end = nodesInOrder.indexOf(id);
					const [from, to] = [
						Math.min(start, end),
						Math.max(start, end),
					];
					nextSelected = nodesInOrder.slice(from, to + 1);
				} else if (isCtrl) {
					nextSelected = isSelected
						? selectedIds.filter((nodeId) => nodeId !== id)
						: [...selectedIds, id];
				} else {
					nextSelected = [id];
				}

				selectCtx.onNodeSelect(event, nextSelected);
			} else {
				selectCtx.onNodeSelect(event, [id]);
			}
		};

		return (
			<li
				ref={ref}
				id={id}
				role="treeitem"
				aria-expanded={hasChildren ? isExpanded : undefined}
				aria-selected={isSelected}
				className={cn("flex flex-col", className)}
				tabIndex={-1}
				onClick={handleSelection}
				onKeyDown={handleSelection}
				{...otherProps}
			>
				{/** biome-ignore lint/a11y/useSemanticElements: this is valid since it is a treeview */}
				<div
					role="button"
					tabIndex={0}
					className={cn(
						"flex w-full items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-muted",
						"cursor-pointer",
					)}
				>
					{hasChildren ? (
						<button
							type="button"
							className="mr-1 flex w-[15px] shrink-0 cursor-pointer items-center justify-center rounded hover:bg-accent"
							onClick={(e) => {
								e.stopPropagation();
								onToggleExpand(e);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.stopPropagation();
									onToggleExpand(e);
								}
							}}
							aria-label={isExpanded ? "Collapse" : "Expand"}
						>
							{isExpanded ? (
								<ChevronDownIcon />
							) : (
								<ChevronRightIcon />
							)}
						</button>
					) : (
						<div className="mr-1 flex w-[15px] shrink-0 justify-center" />
					)}

					<span className="w-full overflow-hidden font-medium">
						{label}
					</span>
				</div>
				{isExpanded && hasChildren && (
					// biome-ignore lint/a11y/useSemanticElements: this is valid since it is a treeview
					<ul role="group" className="ml-4">
						{children}
					</ul>
				)}
			</li>
		);
	},
);
TreeItem.displayName = "TreeItem";

export { TreeView, TreeItem };
