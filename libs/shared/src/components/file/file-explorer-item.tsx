import { Ellipsis, FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TreeViewItem,
	useTreeView,
} from "@semoss/ui/next";
import type { FileItem, FileMode } from "./file.types";
import { FileExplorerMenuItem } from "./file-explorer-menu-item";

interface FileExplorerItemProps extends React.HTMLAttributes<HTMLLIElement> {
	/** Mode of file editor */
	mode: FileMode;

	/** Item */
	item: FileItem;

	/**
	 * Refresh callback to refresh the items
	 */
	refresh: () => void;

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

	actions = [],
	secondaryActions = [],
	ItemComponent = FileExplorerItem,
	...otherProps
}) => {
	const treeView = useTreeView<FileItem>();
	const insight = useInsight();
	const isDirectory = item.type === "directory";
	const isExpanded = treeView.expanded.includes(item.path);

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
		<TreeViewItem
			id={item.path}
			item={item}
			loading={getChildren.status === "LOADING"}
			label={
				<div
					className="group flex w-full flex-1 flex-row items-center gap-2"
					title={`Path: ${item.path} Last Modified: ${item.lastModified}`}
				>
					{renderIcon()}
					<span className="flex-1 truncate text-sm">{item.name}</span>
					<div className="pointer-events-none flex flex-row items-center opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
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
					</div>
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
					{getChildren.status === "SUCCESS" &&
						getChildren.data.map((child) => (
							<ItemComponent
								key={child.path}
								mode={mode}
								item={child}
								refresh={refresh}
								actions={actions}
								secondaryActions={secondaryActions}
							/>
						))}
					{getChildren.status === "SUCCESS" &&
						getChildren.data.length === 0 && (
							<Muted className="flex items-center justify-center py-2 text-xs">
								Empty folder
							</Muted>
						)}
					{/* Placeholder to ensure chevron is always shown for directories */}
					{getChildren.status !== "LOADING" &&
						getChildren.status !== "SUCCESS" && (
							<span className="hidden" />
						)}
				</>
			) : null}
		</TreeViewItem>
	);
};
