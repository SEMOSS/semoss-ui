import { observer } from 'mobx-react-lite';
import { Menu, MenuItem } from '@mui/material';

import { useBlock, useFrame } from '@/hooks';

import { GridBlockColumn } from './grid-block.types';
import { GridBlockDef } from './GridBlock';

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
            id = '',
            frame = null,
            contextMenu = null,
            onClose = () => null,
        }) => {
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
                                        contextMenu.column.selector
                                    }==${JSON.stringify(contextMenu.value)})`,
                                );
                                onClose();
                            }}
                        >
                            Filter {contextMenu.column.name} ==
                            {typeof contextMenu.value === 'string'
                                ? contextMenu.value
                                : JSON.stringify(contextMenu.value)}
                        </MenuItem>
                    ) : null}
                </Menu>
            );
        },
    );
