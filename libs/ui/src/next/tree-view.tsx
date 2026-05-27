import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import React, {
	createContext,
	type ReactNode,
	useContext,
	useRef,
} from "react";

const DOUBLE_CLICK_MS = 250;

import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

interface TreeViewContextProps<T = unknown> {
	expanded: string[];
	onExpandChange?: (expanded: string[]) => void;
	onItemSelect?: (item: T) => void;
	onItemDoubleClick?: (item: T) => void;
}

const TreeViewContext = createContext<TreeViewContextProps | null>(null);

const DepthContext = createContext(0);

function useTreeView<T>() {
	const context = useContext(
		TreeViewContext,
	) as TreeViewContextProps<T> | null;
	if (!context) {
		throw new Error("useTreeView must be used within a TreeViewProvider.");
	}

	return context;
}

interface TreeViewProps<T = unknown>
	extends React.HTMLAttributes<HTMLDivElement> {
	onItemSelect?: (item: T) => void;
	onItemDoubleClick?: (item: T) => void;
	expanded: string[];
	onExpandChange: (expanded: string[]) => void;
}

function TreeView<T>({
	children,
	className,
	onItemSelect = () => null,
	onItemDoubleClick,
	expanded,
	onExpandChange,
	...otherProps
}: TreeViewProps<T>) {
	return (
		<TreeViewContext.Provider
			value={{
				expanded: expanded,
				onItemSelect: onItemSelect as (item: unknown) => void,
				onItemDoubleClick: onItemDoubleClick as
					| ((item: unknown) => void)
					| undefined,
				onExpandChange: onExpandChange,
			}}
		>
			<div
				role="tree"
				className={cn("m-0 list-none p-0", className)}
				tabIndex={0}
				{...otherProps}
			>
				{children}
			</div>
		</TreeViewContext.Provider>
	);
}

interface TreeViewItemProps<T = unknown>
	extends React.HTMLAttributes<HTMLLIElement> {
	id: string;
	label: ReactNode;
	item: T;
	loading?: boolean;
	leadingIcon?: ReactNode;
}

const TreeViewItem = React.forwardRef(function TreeViewItem<T>(
	{
		id,
		label,
		children,
		className,
		item,
		loading,
		leadingIcon,
		...otherProps
	}: TreeViewItemProps<T>,
	ref: React.ForwardedRef<HTMLLIElement>,
) {
	const treeView = useTreeView<T>();
	const depth = useContext(DepthContext);
	const lastClickRef = useRef<number>(0);

	const isExpanded = treeView.expanded.includes(id);
	const hasChildren = React.Children.count(children) > 0;

	const handleItemToggle = (event: React.SyntheticEvent) => {
		event.stopPropagation();
		if (isExpanded) {
			treeView.onExpandChange?.(
				treeView.expanded.filter((e) => e !== id),
			);
		} else {
			treeView.onExpandChange?.([...treeView.expanded, id]);
		}
	};

	const handleItemClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		const now = Date.now();
		const isDoubleClick = now - lastClickRef.current < DOUBLE_CLICK_MS;
		lastClickRef.current = isDoubleClick ? 0 : now;
		if (isDoubleClick) {
			treeView.onItemDoubleClick?.(item);
		}
		treeView.onItemSelect?.(item);
	};

	return (
		<li
			ref={ref}
			id={id}
			role="treeitem"
			aria-expanded={hasChildren ? isExpanded : undefined}
			className={cn("flex flex-col", className)}
			tabIndex={-1}
			{...otherProps}
		>
			<div
				className={cn(
					"flex w-full cursor-pointer items-center gap-1 rounded py-1 pe-2 transition-colors hover:bg-muted",
				)}
				style={{ paddingLeft: depth * 16 + 8 }}
			>
				{hasChildren ? (
					<button
						type="button"
						className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-accent"
						onClick={handleItemToggle}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleItemToggle(e);
							}
						}}
						aria-label={isExpanded ? "Collapse" : "Expand"}
						disabled={loading}
					>
						{loading ? (
							<Spinner className="size-4" />
						) : isExpanded ? (
							<ChevronDownIcon className="size-4" />
						) : (
							<ChevronRightIcon className="rtl:-scale-x-100 size-4" />
						)}
					</button>
				) : leadingIcon ? (
					<div className="flex size-4 shrink-0 items-center justify-center">
						{leadingIcon}
					</div>
				) : (
					<div className="flex size-4 shrink-0" />
				)}

				{/* biome-ignore lint/a11y/useSemanticElements: this is valid */}
				<div
					role="button"
					tabIndex={0}
					className="w-full overflow-hidden"
					onClick={handleItemClick}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							treeView.onItemSelect?.(item);
						}
					}}
				>
					{label}
				</div>
			</div>
			{isExpanded && hasChildren && (
				<DepthContext.Provider value={depth + 1}>
					<ul>{children}</ul>
				</DepthContext.Provider>
			)}
		</li>
	);
}) as <T>(
	props: TreeViewItemProps<T> & React.RefAttributes<HTMLLIElement>,
) => React.ReactElement | null;

export type { TreeViewProps, TreeViewItemProps };
export { TreeView, TreeViewItem, useTreeView };
