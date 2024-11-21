import { observer } from 'mobx-react-lite';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import {
    Autocomplete,
    IconButton,
    List,
    TextField,
    useNotification,
} from '@semoss/ui';
import { useBlockSettings, useBlocksPixel, useFrameHeaders } from '@/hooks';
import { BaseSettingSection } from '@/components/block-settings';

import { GridBlockDef } from './GridBlock';
import { GridBlockColumnSettingsItem } from './GridBlockColumnSettingsItem';
import { Sync } from '@mui/icons-material';
import { GridBlockColumn } from './grid-block.types';
import { Stack } from '@mui/material';

interface GridBlockColumnSettingsProps {
    /** Id of the block */
    id: string;
}

export const GridBlockColumnSettings = observer(
    ({ id }: GridBlockColumnSettingsProps) => {
        const notification = useNotification();
        const { data, setData } = useBlockSettings<GridBlockDef>(id);

        // get all of the frames
        const getFrames = useBlocksPixel<string[]>('GetFrames();', {
            data: [],
        });

        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data.frame.name);

        /**
         * Sync the columns with the frame headers
         */
        const syncFrameHeaders = () => {
            try {
                // get the columns by selector
                const columnMap: Record<string, GridBlockColumn> =
                    data.columns.reduce((acc, val) => {
                        acc[val.name] = acc;

                        return acc;
                    }, {});

                // get the frameHeaders as columns
                const columns: GridBlockColumn[] = frameHeaders.data.list.map(
                    (h) => {
                        return {
                            name: h.alias,
                            width: undefined,
                            // add the previous if it exists
                            ...JSON.parse(
                                JSON.stringify(columnMap[h.alias] || {}),
                            ),
                            selector: h.header,
                        };
                    },
                );

                // update the data
                setData('columns', columns);

                notification.add({
                    color: 'success',
                    message: 'Succesfully synchronized headers',
                });
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }
        };

        /**
         * Reorder columns
         * @param startDragIndex
         * @param stopDragIndex
         */
        const reorderColumns = (
            startDragIndex: number,
            stopDragIndex: number,
        ) => {
            // get the columns
            const columns = [...data.columns];

            // remove it
            const [removed] = columns.splice(startDragIndex, 1);

            // add it at the new location
            columns.splice(stopDragIndex, 0, removed);

            // update the data
            setData('columns', columns);
        };

        // options for the autocomplete
        const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];

        // columns to render
        const columns = data.columns || [];

        return (
            <>
                <BaseSettingSection label="Frame">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={getFrames.status !== 'SUCCESS'}
                        value={data.frame.name}
                        options={options}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // update the frame
                            setData('frame.name', value);
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select frame"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    />

                    <IconButton size="small" onClick={() => syncFrameHeaders()}>
                        <Sync />
                    </IconButton>
                </BaseSettingSection>
                <Stack direction={'column'} width={'100%'} overflow={'hjdden'}>
                    <DragDropContext
                        onDragEnd={(result) => {
                            // ingnore if no destination
                            if (!result.destination) {
                                return;
                            }

                            // swap
                            reorderColumns(
                                result.source.index,
                                result.destination.index,
                            );
                        }}
                    >
                        <Droppable droppableId="droppable">
                            {(provided) => (
                                <List
                                    sx={{
                                        width: '100%',
                                    }}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {columns.map((c, cIdx) => {
                                        return (
                                            <GridBlockColumnSettingsItem
                                                id={id}
                                                key={cIdx}
                                                column={c}
                                                index={cIdx}
                                            />
                                        );
                                    })}
                                    {/* <List.Item
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        dense={true}
                                        divider
                                    >
                                        <List.ItemText primary={'Add Column'} />
                                    </List.Item> */}
                                </List>
                            )}
                        </Droppable>
                    </DragDropContext>
                </Stack>
            </>
        );
    },
);
