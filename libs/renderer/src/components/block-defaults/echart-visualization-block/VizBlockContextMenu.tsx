import { observer } from "mobx-react-lite";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@semoss/ui/next";
import { useBlock, type useFrame } from "../../../hooks";
import type { EchartVisualizationBlockDef } from "./VisualizationBlock";

export interface VizBlockContextMenuProps {
	/** ID of the block */
	id: string;

	/** Frame that the user is interacting with */
	frame: ReturnType<typeof useFrame>;

	/** Context MenuTwo */
	contextMenu: {
		mouseX: number;
		mouseY: number;
		// biome-ignore lint/suspicious/noExplicitAny: echart event value type is untyped
		value: any;
	} | null;

	/** Close the context menu */
	onClose: () => void;
}

export const VizBlockContextMenu: React.FC<VizBlockContextMenuProps> = observer(
	({ id = "", frame = null, contextMenu = null, onClose = () => null }) => {
		const { data } = useBlock<EchartVisualizationBlockDef>(id);
		const isOpen = contextMenu !== null;

		return (
			<DropdownMenu
				open={isOpen}
				onOpenChange={(open) => !open && onClose()}
			>
				<DropdownMenuContent
					style={
						contextMenu
							? {
									position: "fixed",
									top: contextMenu.mouseY,
									left: contextMenu.mouseX,
								}
							: {}
					}
				>
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
										contextMenu.value.label
									}==${JSON.stringify(contextMenu.value.value)})`,
								);
								onClose();
							}}
						>
							Filter {contextMenu.value.label} ==
							{typeof contextMenu.value.value === "string"
								? contextMenu.value.value
								: JSON.stringify(contextMenu.value.value)}
						</DropdownMenuItem>
					) : null}
					{contextMenu && !data.contextMenu?.hideExclude ? (
						<DropdownMenuItem
							onClick={() => {
								frame.filter(
									`SetFrameFilter(${
										contextMenu.value.label
									}!=${JSON.stringify(contextMenu.value.value)})`,
								);
								onClose();
							}}
						>
							Exclude {contextMenu.value.label} !=
							{typeof contextMenu.value.value === "string"
								? contextMenu.value.value
								: JSON.stringify(contextMenu.value.value)}
						</DropdownMenuItem>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	},
);
