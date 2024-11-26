import { observer } from 'mobx-react-lite';
import { Draggable } from 'react-beautiful-dnd';

import { IconButton, List } from '@semoss/ui';
import { useBlockSettings } from '@/hooks';

import { GridBlockDef } from './GridBlock';
import { Delete } from '@mui/icons-material';
import { GridBlockColumn } from './grid-block.types';

interface GridBlockColumnSettingsItemProps {
    /** Id of the block */
    id: string;

    /** Index of the column */
    column: GridBlockColumn;

    /** Index of the column */
    index: number;
}

export const GridBlockColumnSettingsItem = observer(
    ({ id, column, index }: GridBlockColumnSettingsItemProps) => {
        const { data, setData } = useBlockSettings<GridBlockDef>(id);

        return (
            <Draggable draggableId={`grid-column--${index}`} index={index}>
                {(provided, snapshot) => (
                    <List.Item
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        dense={true}
                        divider
                        secondaryAction={
                            <>
                                <IconButton
                                    disabled={snapshot.isDragging}
                                    size="small"
                                    onClick={() => {
                                        // get the columns except the current one
                                        const columns = data.columns.filter(
                                            (v, idx) => index !== idx,
                                        );

                                        // update the data
                                        setData('columns', columns);
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </>
                        }
                    >
                        <List.ItemText
                            primary={column.name}
                            secondary={column.selector}
                            primaryTypographyProps={{
                                title: column.name,
                                style: {
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                },
                            }}
                            secondaryTypographyProps={{
                                title: column.selector,
                                style: {
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                },
                            }}
                        />
                    </List.Item>
                )}
            </Draggable>
        );
    },
);
