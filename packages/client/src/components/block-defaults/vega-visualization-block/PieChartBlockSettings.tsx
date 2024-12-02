import { observer } from 'mobx-react-lite';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import {
    Autocomplete,
    IconButton,
    List,
    Select,
    TextField,
    useNotification,
    MenuItem,
    Typography,
} from '@semoss/ui';
import {
    useBlockSettings,
    useBlocksPixel,
    useFrame,
    useFrameHeaders,
} from '@/hooks';
import { BaseSettingSection } from '@/components/block-settings';
import { Sync } from '@mui/icons-material';

import { Stack } from '@mui/material';
import { GridBlockColumn } from '../grid-block/grid-block.types';
import { PieChartBlockSettingsItem } from './PieChartBlockSettingsItem';
import { VegaVisualizationBlockDef } from './VegaVisualizationBlock';
import { useState } from 'react';

interface PieChartBlockSettingsProps {
    /** Id of the block */
    id: string;
}

export const PieChartBlockSettings = observer(
    ({ id }: PieChartBlockSettingsProps) => {
        const notification = useNotification();
        const { data, setData } =
            useBlockSettings<VegaVisualizationBlockDef>(id);
        const [label, setLabel] = useState<any>([]);
        const [dataValue, setDataValue] = useState<any>();
        const [dataLabel, setDataLabel] = useState<any>();

        // get all of the frames
        const getFrames = useBlocksPixel<string[]>('GetFrames();', {
            data: [],
        });

        console.log(data, '>>>1<<<<');
        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data?.frame?.name);

        const handleChangeLabel = (event) => {
            console.log('testecnmlcndl');
            const spec = data.specJson;
            spec['layer'][0]['encoding']['color']['field'] = event.target.value;
            spec['layer'][1]['encoding']['text']['field'] = event.target.value;
            setDataLabel(event.target.value);
            setData('specJson', spec);
        };

        const handleChangeValue = (event) => {
            console.log('testecnmlcndl');
            setDataValue(event.target.value);
            const spec = data.specJson;
            console.log(spec, 'spec');
            spec['layer'][0]['encoding']['theta']['field'] = event.target.value;
            spec['layer'][1]['encoding']['theta']['field'] = event.target.value;
            setData('specJson', spec);
        };

        /**
         * Sync the columns with the frame headers
         */
        const syncFrameHeaders = () => {
            try {
                // get the columns by selector
                const columnMap: Record<string, GridBlockColumn> = {};

                // get the frameHeaders as columns
                const columns: GridBlockColumn[] = frameHeaders?.data?.list.map(
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
                frameHeaders &&
                    setLabel(frameHeaders.data.list.map((item) => item.alias));

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
            const columns = [...data?.columns];

            // remove it
            const [removed] = columns.splice(startDragIndex, 1);

            // add it at the new location
            columns.splice(stopDragIndex, 0, removed);

            // update the data
            setData('columns', columns);
        };

        // options for the autocomplete
        const options = getFrames.status === 'SUCCESS' ? getFrames?.data : [];

        // columns to render
        const columns = data?.columns || [];

        return (
            <>
                <BaseSettingSection label="Frame">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={getFrames.status !== 'SUCCESS'}
                        value={data?.frame?.name}
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
                <Stack>
                    <Typography variant="h6">
                        Label
                        <Select
                            fullWidth
                            name="Label"
                            value={dataLabel ? dataLabel : ''}
                            onChange={handleChangeLabel}
                        >
                            {label.map((item, index) => (
                                <MenuItem key={index} value={item}>
                                    {item}
                                </MenuItem>
                            ))}
                        </Select>
                    </Typography>
                    <Typography variant="h6">
                        Value
                        <Select
                            fullWidth
                            name="Value"
                            value={dataValue ? dataValue : ''}
                            onChange={handleChangeValue}
                        >
                            {label.map((item, index) => (
                                <MenuItem key={index} value={item}>
                                    {item}
                                </MenuItem>
                            ))}
                        </Select>
                    </Typography>
                </Stack>
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
                                            <PieChartBlockSettingsItem
                                                id={id}
                                                key={cIdx}
                                                column={c}
                                                index={cIdx}
                                            />
                                        );
                                    })}
                                </List>
                            )}
                        </Droppable>
                    </DragDropContext>
                </Stack>
            </>
        );
    },
);
