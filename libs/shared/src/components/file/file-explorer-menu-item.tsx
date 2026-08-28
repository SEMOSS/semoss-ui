import { useState } from "react";
import { DropdownMenuItem, Spinner, toast } from "@semoss/ui/next";
import type { FileItem } from "./file.types";

interface FileExplorerMenuItemProps {
	/** Item */
	item: FileItem;

	/** Mode of file editor */
	name: string;

	/** Actions */
	action: (item: FileItem) => Promise<void>;
}

export const FileExplorerMenuItem: React.FC<FileExplorerMenuItemProps> = ({
	item,
	name,
	action,
}) => {
	const [isLoading, setIsLoading] = useState(false);

	return (
		<DropdownMenuItem
			key={name}
			className="justify-between text-xs"
			onClick={(e) => {
				e.stopPropagation();
			}}
			onSelect={async () => {
				try {
					setIsLoading(true);

					// run it
					await action(item);
				} catch (e) {
					toast.error(e.message);
					console.error(e);
				} finally {
					setIsLoading(false);
				}
			}}
		>
			{name}
			{isLoading && <Spinner className="size-4" />}
		</DropdownMenuItem>
	);
};
