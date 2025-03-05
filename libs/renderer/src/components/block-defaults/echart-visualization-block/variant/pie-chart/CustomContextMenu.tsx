import { observer } from "mobx-react-lite";
import { Menu, MenuItem } from "@mui/material";

import { useBlock, useFrame } from "../../../../../hooks";
import { GridBlockDef } from "../../../grid-block/GridBlock";

export interface GridBlockContextMenuProps {
    /** ID of the block */
    id: string;

    /** Frame that the user is interacting with */
    frame: ReturnType<typeof useFrame>;

    /** Context Menu */
    contextMenu: {
        mouseX: number;
        mouseY: number;
        value: any;
    } | null;

    /** Close the context menu */
    onClose: () => void;
}

export const CustomContextMenu: React.FC<GridBlockContextMenuProps> = observer(
    ({ id = "", frame = null, contextMenu = null, onClose = () => null }) => {
        const { data } = useBlock<GridBlockDef>(id);
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
                    <MenuItem
                        dense={true}
                        value={"unfilter"}
                        onClick={() => {
                            frame.unfilter();
                            onClose();
                        }}
                    >
                        Unfilter
                    </MenuItem>
                ) : null}
                {contextMenu && !data.contextMenu?.hideFilter ? (
                    <MenuItem
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
                    </MenuItem>
                ) : null}
                {contextMenu && !data.contextMenu?.hideFilter ? (
                    <MenuItem
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
                    </MenuItem>
                ) : null}
            </Menu>
        );
    },
);
