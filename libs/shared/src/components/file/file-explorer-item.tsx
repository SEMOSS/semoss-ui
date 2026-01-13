import { Ellipsis, FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TreeItem,
} from "@semoss/ui/next";
import type { FileItem, FileMode } from "./file.types";
import { FileExplorerMenuItem } from "./file-explorer-menu-item";

interface FileExplorerItemProps
	extends Omit<React.HTMLAttributes<HTMLLIElement>, "onSelect"> {
	/** Mode of file editor */
	mode: FileMode;

	/** Item */
	item: FileItem;

	/**
	 * Refresh callback to refresh the items
	 */
	refresh: () => void;

	/** Currently expanded paths (from TreeView) */
	expandedPaths: string[];

	/** Callback when item is selected (clicked) */
	onSelect?: (item: FileItem) => void;

	/** Primary actions */
	actions?: ({
		name: string;
		icon: React.ReactNode;
		tooltip: React.ReactNode;
		action: (item: FileItem) => Promise<void>;
	} | null)[];

	/** Secondary Actions */
	secondaryActions?: ({
		name: string;
		action: (item: FileItem) => Promise<void>;
	} | null)[];

	/**
	 * Override for the file item component
	 */
	ItemComponent?: typeof FileExplorerItem;
}

export const FileExplorerItem: React.FC<FileExplorerItemProps> = ({
	mode,
	item,
	refresh,
	expandedPaths,
	onSelect,
	actions = [],
	secondaryActions = [],
	ItemComponent = FileExplorerItem,
	...otherProps
}) => {
	const insight = useInsight();
	const isDirectory = item.type === "directory";
	const isExpanded = expandedPaths.includes(item.path);

	// Only fetch children if expanded and is a directory
	let getChildrenPixel = "";
	if (isDirectory && isExpanded) {
		if (mode.type === "APP") {
			getChildrenPixel = `BrowseAppAssets(filePath=["${item.path}"], project=["${mode.app}"]);`;
		} else if (mode.type === "ENGINE") {
			getChildrenPixel = `BrowseEngineAssets(filePath=["${item.path}"], engine=["${mode.engine}"]);`;
		} else if (mode.type === "INSIGHT") {
			getChildrenPixel = `BrowseInsightAssets(filePath=["${item.path}"]);`;
		}
	}

	const getChildren = usePixel<FileItem[]>(
		getChildrenPixel,
		{},
		insight.insightId,
	);

	const renderIcon = () => {
		if (isDirectory) {
			return isExpanded ? (
				<FolderOpenIcon className="size-4 text-muted-foreground" />
			) : (
				<FolderIcon className="size-4 text-muted-foreground" />
			);
		}
		return <FileIcon className="size-4 text-muted-foreground" />;
	};

	return (
		<TreeItem
			id={item.path}
			onClick={() => onSelect?.(item)}
			label={
				<div
					className="flex w-full flex-1 flex-row items-center gap-2"
					title={`Path: ${item.path} Last Modified: ${item.lastModified}`}
				>
					{renderIcon()}
					<span className="flex-1 truncate text-sm">{item.name}</span>
					{actions.map((a) => {
						if (!a) {
							return null;
						}

						return (
							<Tooltip key={a.name}>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={(e) => {
											e.stopPropagation();
											a.action(item);
										}}
									>
										{a.icon}
									</Button>
								</TooltipTrigger>
								<TooltipContent>{a.tooltip}</TooltipContent>
							</Tooltip>
						);
					})}
					{secondaryActions.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={(e) => e.stopPropagation()}
								>
									<Ellipsis className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuGroup>
									{secondaryActions.map((a) => {
										if (!a) {
											return null;
										}

										return (
											<FileExplorerMenuItem
												key={a.name}
												item={item}
												name={a.name}
												action={a.action}
											/>
										);
									})}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			}
			{...otherProps}
		>
			{isDirectory ? (
				<>
					{getChildren.status === "LOADING" && (
						<div className="flex items-center justify-center py-2">
							<Spinner className="size-4" />
						</div>
					)}
					{getChildren.status === "SUCCESS" &&
						getChildren.data.map((child) => (
							<ItemComponent
								key={child.path}
								mode={mode}
								item={child}
								refresh={refresh}
								expandedPaths={expandedPaths}
								onSelect={onSelect}
								actions={actions}
								secondaryActions={secondaryActions}
							/>
						))}
					{getChildren.status === "SUCCESS" &&
						getChildren.data.length === 0 && (
							<div className="flex items-center justify-center py-2 text-muted-foreground text-xs">
								Empty folder
							</div>
						)}
					{/* Placeholder to ensure chevron is always shown for directories */}
					{getChildren.status !== "LOADING" &&
						getChildren.status !== "SUCCESS" && (
							<span className="hidden" />
						)}
				</>
			) : null}
		</TreeItem>
	);
};
