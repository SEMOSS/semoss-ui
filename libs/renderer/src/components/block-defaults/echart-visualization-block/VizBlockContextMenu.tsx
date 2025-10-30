import { observer } from "mobx-react-lite";
import { Menu } from "@semoss/ui";
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		value: any;
	} | null;

	/** Close the context menu */
	onClose: () => void;
}

export const VizBlockContextMenu: React.FC<VizBlockContextMenuProps> = observer(
	({ id = "", frame = null, contextMenu = null, onClose = () => null }) => {
		const { data } = useBlock<EchartVisualizationBlockDef>(id);
		return (
			<Menu
				open={contextMenu !== null}
				onClose={() => onClose()}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu !== null
						? {
								top: contextMenu.mouseY,
								left: contextMenu.mouseX,
							}
						: undefined
				}
			>
				{contextMenu && !data.contextMenu?.hideUnfilter ? (
					<Menu.Item
						dense={true}
						value={"unfilter"}
						onClick={() => {
							frame.unfilter();
							onClose();
						}}
					>
						Unfilter
					</Menu.Item>
				) : null}
				{contextMenu && !data.contextMenu?.hideFilter ? (
					<Menu.Item
						dense={true}
						value={"filter"}
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
					</Menu.Item>
				) : null}
				{contextMenu && !data.contextMenu?.hideExclude ? (
					<Menu.Item
						dense={true}
						value={"filter"}
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
					</Menu.Item>
				) : null}
			</Menu>
		);
	},
);
