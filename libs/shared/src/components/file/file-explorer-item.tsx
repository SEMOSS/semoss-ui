import { FileIcon, FolderIcon } from "lucide-react";

interface FileExplorerItemProps
	extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onSelect"> {
	/** Item */
	item: {
		/**
		 * Name of the file
		 */
		name: string;

		/**
		 * Path of the file
		 */
		path: string;

		/**
		 * Track if it is a directory
		 */
		type?: "directory";

		/**
		 * Last modified date
		 */
		lastModified?: string;
	};

	/**
	 * Actions to show with the item
	 */
	actions?: React.ReactNode;

	/**
	 * Refresh callback to refresh the items
	 */
	refresh?: () => void;

	/** Callback that is triggered when selected */
	onSelect?: (item: FileExplorerItemProps["item"]) => void;
}

export const FileExplorerItem: React.FC<FileExplorerItemProps> = ({
	item,
	actions,
	refresh,
	onSelect = () => null,
	...props
}) => {
	return (
		<span
			title={item.path}
			role="option"
			className="flex w-full cursor-default flex-row items-center overflow-hidden rounded-sm px-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
			tabIndex={0}
			onClick={() => onSelect(item)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					onSelect(item);
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
			{actions}
		</span>
	);
};
