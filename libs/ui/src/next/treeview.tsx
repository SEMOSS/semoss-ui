import { ChevronDown, ChevronRight } from "lucide-react";
import React, {
	createContext,
	forwardRef,
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

interface TreeIconContextProps {
	defaultExpandIcon?: React.ReactNode;
	defaultCollapseIcon?: React.ReactNode;
}

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
const TreeIconContext = createContext<TreeIconContextProps>({});
const TreeViewSelectionContext =
	React.createContext<TreeViewSelectionContextProps>({});

export type TreeItemProps = {
	label: ReactNode;
	id: string;
	children?: ReactNode;
	className?: string;
	onClick?: (event: React.SyntheticEvent | null) => void;
	title?: string;
	expandIcon?: React.ReactNode;
	collapseIcon?: React.ReactNode;
} & React.HTMLAttributes<HTMLLIElement>;

const TreeItem = React.memo(
	forwardRef<HTMLLIElement, TreeItemProps>(
		(
			{
				label,
				children,
				className,
				id,
				onClick,
				expandIcon,
				collapseIcon,
				...rest
			},
			ref,
		) => {
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
			// Handles Icons
			const { defaultExpandIcon, defaultCollapseIcon } =
				useContext(TreeIconContext) || {};
			const ExpandIcon = expandIcon || defaultExpandIcon || (
				<ChevronDown />
			);
			const CollapseIcon = collapseIcon || defaultCollapseIcon || (
				<ChevronRight />
			);

			// Handles Checkbox Selection
			const selectCtx = useContext(TreeViewSelectionContext);
			const isMultiSelect = selectCtx.multiSelect || false;
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
				if (isMultiSelect) {
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
					onClick={(e) => {
						if (typeof onClick === "function") {
							onClick(e);
						}
						selectCtx.setLastClickedId(id);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							if (typeof onClick === "function") {
								onClick(e);
							}
							selectCtx.setLastClickedId(id);
						}
					}}
					{...rest}
				>
					<div
						role="button"
						tabIndex={0}
						className={cn(
							"flex w-full items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-muted",
							hasChildren && "cursor-pointer",
						)}
						onClick={(event) => {
							if (typeof onClick === "function") {
								onClick(event);
							}
							selectCtx.setLastClickedId(id);
							hasChildren && onToggleExpand(event);
						}}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								if (typeof onClick === "function") {
									onClick(event);
								}
								selectCtx.setLastClickedId(id);
								hasChildren && onToggleExpand(event);
							}
						}}
					>
						{hasChildren ? (
							isExpanded ? (
								<div className="mr-1 flex w-[15px] flex-shrink-0 justify-center">
									{CollapseIcon}
								</div>
							) : (
								<div className="mr-1 flex w-[15px] flex-shrink-0 justify-center">
									{ExpandIcon}
								</div>
							)
						) : (
							<div className="mr-1 flex w-[15px] flex-shrink-0 justify-center" />
						)}

						<span
							role="button"
							tabIndex={0}
							onClick={(e) => {
								handleSelection(e);
							}}
							onKeyDown={(e) => {
								if (e.key === " " || e.key === "Enter")
									handleSelection(e);
							}}
							className="w-full font-medium"
						>
							{label}
						</span>
					</div>
					{isExpanded && hasChildren && (
						<ul role="group" className="ml-4 cursor-pointer">
							{children}
						</ul>
					)}
				</li>
			);
		},
	),
);
TreeItem.displayName = "TreeItem";

export interface TreeViewProps {
	/**
	 * The content of the component.
	 */
	children?: React.ReactNode;
	className?: string;
	/**
	 * The default icon used to collapse the node.
	 */
	defaultCollapseIcon?: React.ReactNode;
	/**
	 * Expanded node ids.
	 * Used when the item's expansion are not controlled.
	 * @default []
	 */
	defaultExpanded?: string[];
	/**
	 * The default icon used to expand the node.
	 */
	defaultExpandIcon?: React.ReactNode;
	/**
	 * If `true`, will allow focus on disabled items.
	 * @default false
	 */
	disabledItemsFocusable?: boolean;
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

const TreeView = (props: TreeViewProps) => {
	const {
		id,
		children,
		className,
		defaultExpanded,
		defaultCollapseIcon,
		defaultExpandIcon,
		// disabledItemsFocusable,
		disableSelection,
		expanded,
		multiSelect = false,
		onNodeSelect,
		onNodeToggle,
		selected,
		...rest
	} = props;

	const isSelectControlled = selected !== undefined && selected !== null;
	const [localSelected, setLocalSelected] = useState<string[]>([]);
	const isExpansionControlled =
		expanded !== undefined &&
		expanded !== null &&
		typeof onNodeToggle === "function";
	const [expandedIds, setExpandedIds] = useState(defaultExpanded || []);
	const [lastClickedId, setLastClickedId] = useState<string | null>(null);

	return (
		<TreeIconContext.Provider
			value={{
				defaultExpandIcon,
				defaultCollapseIcon,
			}}
		>
			<TreeViewSelectionContext.Provider
				value={{
					selectedItems: isSelectControlled
						? selected
						: localSelected,
					onNodeSelect: isSelectControlled
						? onNodeSelect
						: (event, ids) => {
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
							: (event, nextExpandedIds) => {
									setExpandedIds(nextExpandedIds);
								},
					}}
				>
					<div
						role="tree"
						className={cn("m-0 list-none p-0", className)}
						tabIndex={0}
						id={id}
						{...rest}
					>
						{children}
					</div>
				</TreeExpandContext.Provider>
			</TreeViewSelectionContext.Provider>
		</TreeIconContext.Provider>
	);
};

export { TreeView, TreeItem };
