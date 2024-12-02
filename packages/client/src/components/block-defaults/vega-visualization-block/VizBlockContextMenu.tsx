import { observer } from 'mobx-react-lite';
import { Menu, MenuItem } from '@mui/material';
import { Divider } from '@semoss/ui';

import { useBlock, useFrame } from '@/hooks';
import { VegaVisualizationBlockDef } from './VegaVisualizationBlock';

export interface VizBlockContextMenuProps {
    /** ID of the block */
    id: string;

    /** Frame that the user is interacting with */
    frame: ReturnType<typeof useFrame>;

    /** Context Menu */
    contextMenu: {
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null;

    /** Close the context menu */
    onClose: () => void;
}

export const VizBlockContextMenu: React.FC<VizBlockContextMenuProps> = observer(
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
                {contextMenu && !data.contextMenu?.hideFilter ? (
                    <>
                        <MenuItem dense={true}>
                            {`${contextMenu.value['label']} = ${JSON.stringify(
                                contextMenu.value['value'][
                                    contextMenu.value['label']
                                ],
                            )}`}
                        </MenuItem>
                        <MenuItem
                            dense={true}
                            value={'filter'}
                            onClick={() => {
                                frame.filter(
                                    `SetFrameFilter(${
                                        contextMenu.value['label']
                                    }==${JSON.stringify(
                                        contextMenu.value['value'][
                                            contextMenu.value['label']
                                        ],
                                    )})`,
                                );
                                onClose();
                            }}
                        >
                            Include
                        </MenuItem>
                        <MenuItem
                            dense={true}
                            value={'filter'}
                            onClick={() => {
                                frame.filter(
                                    `AddFrameFilter(${
                                        contextMenu.value['label']
                                    }!=${JSON.stringify(
                                        contextMenu.value['value'][
                                            contextMenu.value['label']
                                        ],
                                    )})`,
                                );
                                onClose();
                            }}
                        >
                            Exclude
                        </MenuItem>
                    </>
                ) : null}
                <Divider />
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
            </Menu>
        );
    },
);
