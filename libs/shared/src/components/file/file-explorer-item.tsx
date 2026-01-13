import { Ellipsis, FileIcon, FolderIcon } from "lucide-react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { FileItem } from "./file.types";
import { FileExplorerMenuItem } from "./file-explorer-menu-item";

interface FileExplorerItemProps extends React.HTMLAttributes<HTMLSpanElement> {
	/** Item */
	item: FileItem;

	/**
	 * Refresh callback to refresh the items
	 */
	refresh: () => void;

	/** Callback that is triggered when selected */
	onSelect?: () => void;

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
}

export const FileExplorerItem: React.FC<FileExplorerItemProps> = ({
	item,
	refresh,
	onSelect = () => null,
	actions = [],
	secondaryActions = [],
	...props
}) => {
	return (
		<span
			title={item.path}
			role="option"
			className="flex w-full cursor-default flex-row items-center overflow-hidden rounded-sm px-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
			tabIndex={0}
			onClick={() => onSelect()}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					onSelect();
				}
			}}
			{...props}
		>
			<div className="flex flex-1 flex-row items-center gap-2 overflow-hidden overflow-hidden py-2">
				{item.type === "directory" ? (
					<FolderIcon className="size-4" />
				) : (
					<FileIcon className="size-4" />
				)}
				<span className="flex-1 truncate text-sm">{item.name}</span>
				<div className="text-muted-foreground text-xs">
					{item.lastModified}
				</div>
			</div>
			{actions.map((a) => {
				if (!a) {
					return null;
				}

				return (
					<Tooltip key={a.name}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
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
							onClick={(e) => e.stopPropagation()}
						>
							<Ellipsis />
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
		</span>
	);
};
