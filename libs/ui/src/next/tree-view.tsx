import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import React, { createContext, type ReactNode, useContext } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

interface TreeViewContextProps<T = unknown> {
	expanded: string[];
	onExpandChange?: (expanded: string[]) => void;
	onItemSelect?: (item: T) => void;
}

const TreeViewContext = createContext<TreeViewContextProps | null>(null);

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
	expanded: string[];
	onExpandChange: (expanded: string[]) => void;
}

function TreeView<T>({
	children,
	className,
	onItemSelect = () => null,
	expanded,
	onExpandChange,
	...otherProps
}: TreeViewProps<T>) {
	return (
		<TreeViewContext.Provider
			value={{
				expanded: expanded,
				onItemSelect: onItemSelect,
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
}

const TreeViewItem = React.forwardRef(function TreeViewItem<T>(
	{
		id,
		label,
		children,
		className,
		item,
		loading,
		...otherProps
	}: TreeViewItemProps<T>,
	ref: React.ForwardedRef<HTMLLIElement>,
) {
	const treeView = useTreeView<T>();

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

	const handleItemSelect = (event: React.SyntheticEvent) => {
		event.stopPropagation();
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
					"flex w-full cursor-pointer items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-muted",
				)}
			>
				{hasChildren ? (
					<button
						type="button"
						className="mr-1 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-accent"
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
							<ChevronRightIcon className="size-4" />
						)}
					</button>
				) : (
					<div className="mr-1 flex size-4 shrink-0" />
				)}

				{/* biome-ignore lint/a11y/useSemanticElements: this is valid */}
				<div
					role="button"
					tabIndex={0}
					className="w-full overflow-hidden"
					onClick={handleItemSelect}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleItemSelect(e);
						}
					}}
				>
					{label}
				</div>
			</div>
			{isExpanded && hasChildren && (
				// biome-ignore lint/a11y/useSemanticElements: this is correct
				<ul role="group" className="ml-4">
					{children}
				</ul>
			)}
		</li>
	);
}) as <T>(
	props: TreeViewItemProps<T> & React.RefAttributes<HTMLLIElement>,
) => React.ReactElement | null;

export { TreeView, TreeViewItem, useTreeView };
