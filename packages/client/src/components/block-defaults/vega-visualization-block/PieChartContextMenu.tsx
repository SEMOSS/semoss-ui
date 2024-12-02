import { observer } from 'mobx-react-lite';
import { Menu, MenuItem } from '@mui/material';

import { useBlock, useFrame } from '@/hooks';

import { GridBlockColumn } from '../grid-block/grid-block.types';
import { VegaVisualizationBlockDef } from './VegaVisualizationBlock';

export interface PieChartContextMenuProps {
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

export const PieChartContextMenu: React.FC<PieChartContextMenuProps> = observer(
    ({ id = '', frame = null, contextMenu = null, onClose = () => null }) => {
        const { data } = useBlock<VegaVisualizationBlockDef>(id);

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
                        value={'unfilter'}
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
                        value={'filter'}
                        onClick={() => {
                            frame.filter(
                                `SetFrameFilter(${
                                    contextMenu.value.label
                                }==${JSON.stringify(
                                    contextMenu.value.value[
                                        contextMenu.value.label
                                    ],
                                )})`,
                            );
                            onClose();
                        }}
                    >
                        Filter {contextMenu.value.label} ==
                        {typeof contextMenu.value.value[
                            contextMenu.value.label
                        ] === 'string'
                            ? contextMenu.value.value[contextMenu.value.label]
                            : JSON.stringify(
                                  contextMenu.value.value[
                                      contextMenu.value.label
                                  ],
                              )}
                    </MenuItem>
                ) : null}
                {contextMenu && !data.contextMenu?.hideExclude ? (
                    <MenuItem
                        dense={true}
                        value={'filter'}
                        onClick={() => {
                            frame.filter(
                                `SetFrameFilter(${
                                    contextMenu.value.label
                                }!=${JSON.stringify(
                                    contextMenu.value.value[
                                        contextMenu.value.label
                                    ],
                                )})`,
                            );
                            onClose();
                        }}
                    >
                        Exclude {contextMenu.value.label} !=
                        {typeof contextMenu.value.value[
                            contextMenu.value.label
                        ] === 'string'
                            ? contextMenu.value.value[contextMenu.value.label]
                            : JSON.stringify(
                                  contextMenu.value.value[
                                      contextMenu.value.label
                                  ],
                              )}
                    </MenuItem>
                ) : null}
            </Menu>
        );
    },
);
