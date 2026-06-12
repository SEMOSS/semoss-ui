import { observer } from "mobx-react-lite";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { useBlock, type useFrame } from "../../../hooks";
import type { GridBlockDef } from "./grid-block";
import type { GridBlockColumn } from "./grid-block.types";

export interface GridBlockContextMenuProps {
	/** ID of the block */
	id: string;

	/** Frame that the user is interacting with */
	frame: ReturnType<typeof useFrame>;

	/** Context Menu */
	contextMenu: {
		mouseX: number;
		mouseY: number;
		column: GridBlockColumn;
		value: unknown;
	} | null;

	/** Close the context menu */
	onClose: () => void;
}

export const GridBlockContextMenu: React.FC<GridBlockContextMenuProps> =
	observer(
		({
			id = "",
			frame = null,
			contextMenu = null,
			onClose = () => null,
		}) => {
			const { data } = useBlock<GridBlockDef>(id);

			return (
				<DropdownMenu
					open={contextMenu !== null}
					onOpenChange={(open) => !open && onClose()}
				>
					<DropdownMenuTrigger asChild>
						<span
							style={{
								position: "fixed",
								top: contextMenu?.mouseY ?? 0,
								left: contextMenu?.mouseX ?? 0,
								width: 0,
								height: 0,
							}}
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{contextMenu && !data.contextMenu?.hideUnfilter ? (
							<DropdownMenuItem
								onClick={() => {
									frame.unfilter();
									onClose();
								}}
							>
								Unfilter
							</DropdownMenuItem>
						) : null}
						{contextMenu && !data.contextMenu?.hideFilter ? (
							<DropdownMenuItem
								onClick={() => {
									frame.filter(
										`SetFrameFilter(${
											contextMenu.column.selector
										}==${JSON.stringify(contextMenu.value)})`,
									);
									onClose();
								}}
							>
								Filter {contextMenu.column.name} =={" "}
								{typeof contextMenu.value === "string"
									? contextMenu.value
									: JSON.stringify(contextMenu.value)}
							</DropdownMenuItem>
						) : null}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	);
