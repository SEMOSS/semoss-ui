import { observer } from "mobx-react-lite";

import { MenuTwo, MenuItemTwo } from "@semoss/ui";

import { useBlock, useFrame } from "../../../hooks";
import { EchartVisualizationBlockDef } from "./VisualizationBlock";

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
export const CustomContextMenu: React.FC<VizBlockContextMenuProps> = observer(
    ({
        id = "",
        frame = null,
        contextMenu = null,
        onClose = () => null,
    }) => {
        const { data } = useBlock<EchartVisualizationBlockDef>(id);
        return (
            <MenuTwo
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
                    <MenuItemTwo
                        dense={true}
                        value={"unfilter"}
                        onClick={() => {
                            frame.unfilter(data?.frame?.name);
                            onClose();
                        }}
                    >
                        Unfilter
                    </MenuItemTwo>
                ) : null}
                {contextMenu && !data.contextMenu?.hideFilter ? (
                    <MenuItemTwo
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
                    </MenuItemTwo>
                ) : null}
                {contextMenu && !data.contextMenu?.hideExclude ? (
                    <MenuItemTwo
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
                    </MenuItemTwo>
                ) : null}
            </MenuTwo>
        );
    },
);
