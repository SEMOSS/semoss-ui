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
import { GridBlockColumn } from '../../grid-block/grid-block.types';
import { useEffect, useMemo, useState } from 'react';
import { EchartVisualizationBlockDef } from '../EchartVisualizationBlock';
import { ScatterPlotBlockSettingsItem } from './ScatterPlotBlockSettingsItem';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import { Paths, PathValue } from '@/types';
import { Block, BlockDef } from '@/stores';
import path from 'path';

interface ScatterPlotBlockSettingsProps<D extends BlockDef = BlockDef> {
    /** Id of the block */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const ScatterPlotBlockSettings = observer(
    ({ id, path }: ScatterPlotBlockSettingsProps) => {
        const notification = useNotification();
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [label, setLabel] = useState<any>([]);
        const [xAxisValue, setXAxisValue] = useState<any>();
        const [yAxisValue, setYAxisValue] = useState<any>();
        const [dataLabel, setDataLabel] = useState<any>();
        const [color, setColor] = useState<any>();
        const [size, setSize] = useState<any>();
        const [value, setValue] = useState('');
        const [tooltip, setTooltip] = useState<any>('');

        // get all of the frames
        const getFrames = useBlocksPixel<string[]>('GetFrames();', {
            data: [],
        });
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }
                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        useEffect(() => {
            console.log('frame change', data);
            // if (data) {
            const json = JSON.parse(computedValue);
            let state = json['_state'];
            console.log(state, 'state');
            if (state && state.hasOwnProperty('fields')) {
                console.log('test123');
                reinitializeStates(state['fields']);
            }
            //else {
            //     json['_state'] = {};
            //     setXAxisValue([]);
            //     setYAxisValue([]);
            //     setTooltip([]);
            //     setValue(JSON.stringify(json, null, 2));
            // }
            // }
        }, [id]);
        const reinitializeStates = (state) => {
            console.log(state, 'qsdcv');
            state.XAxis && setXAxisValue(state.XAxis);
            state.YAxis && setYAxisValue(state.YAxis);
            state.tooltip && setTooltip(state.tooltip ?? '');
            state.label && setDataLabel(state.label ?? '');
            state.size && setSize(state.size ?? '');
            state.color && setColor(state.color ?? '');
        };

        console.log(xAxisValue, '>>>1<<<<');
        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data?.frame?.name);
        const fields = frameHeaders.data.list.map((field) => field.alias) || [];

        const handleChangeLabel = (label) => {
            // console.log('testecnmlcndl');
            let tempValue = JSON.parse(value);
            console.log(tempValue);
            tempValue['_state'] =
                tempValue['_state'] &&
                Object.keys(tempValue['_state']).length > 0
                    ? tempValue['_state']
                    : {};
            tempValue['_state']['fields'] = {
                ...tempValue['_state']['fields'],
                label: label,
            };
            tempValue['series'][0]['label']['name'] = label;
            // const spec = data.option;
            // spec['series'][0]['label']['name'] = event.target.value;
            setDataLabel(label);
            setValue(JSON.stringify(tempValue));
            setData('option', tempValue);
        };

        const handleChangeXAxis = (xaxis) => {
            console.log('testecnmlcndl');
            let tempValue = JSON.parse(value);
            console.log(tempValue);
            tempValue['_state'] =
                tempValue['_state'] &&
                Object.keys(tempValue['_state']).length > 0
                    ? tempValue['_state']
                    : {};
            tempValue['_state']['fields'] = {
                ...tempValue['_state']['fields'],
                XAxis: xaxis,
            };
            setXAxisValue(xaxis);
            tempValue['xAxis']['name'] = xaxis;
            tempValue['xAxis']['pixelName'] = xaxis;
            setValue(JSON.stringify(tempValue));
            setData('option', tempValue);
        };
        const handleChangeYAxis = (yaxis) => {
            console.log('testecnmlcndl');
            setYAxisValue(yaxis);
            let tempValue = JSON.parse(value);
            console.log(tempValue);
            tempValue['_state'] =
                tempValue['_state'] &&
                Object.keys(tempValue['_state']).length > 0
                    ? tempValue['_state']
                    : {};
            tempValue['_state']['fields'] = {
                ...tempValue['_state']['fields'],
                YAxis: yaxis,
            };
            tempValue['yAxis']['name'] = yaxis;
            tempValue['yAxis']['pixelName'] = yaxis;
            setValue(JSON.stringify(tempValue));
            setData('option', tempValue);
        };
        const handleChangeColor = (colors) => {
            // console.log('testecnmlcndl');
            let tempValue = JSON.parse(value);
            console.log(tempValue);
            tempValue['_state'] =
                tempValue['_state'] &&
                Object.keys(tempValue['_state']).length > 0
                    ? tempValue['_state']
                    : {};
            tempValue['_state']['fields'] = {
                ...tempValue['_state']['fields'],
                color: colors,
            };
            // const spec = data.option;
            // spec['series'][0]['label']['name'] = event.target.value;
            setColor(colors);
            setValue(JSON.stringify(tempValue));
            setData('option', tempValue);
        };
        const handleChangeSize = (size) => {
            // console.log('testecnmlcndl');
            let tempValue = JSON.parse(value);
            console.log(tempValue);
            tempValue['_state'] =
                tempValue['_state'] &&
                Object.keys(tempValue['_state']).length > 0
                    ? tempValue['_state']
                    : {};
            tempValue['_state']['fields'] = {
                ...tempValue['_state']['fields'],
                size: size,
            };
            setSize(size);
            setValue(JSON.stringify(tempValue));
            setData('option', tempValue);
        };
        const handleChangeTooltip = (tooltips) => {
            // console.log('testecnmlcndl');
            let tempValue = JSON.parse(value);
            console.log(tempValue);
            tempValue['_state'] =
                tempValue['_state'] &&
                Object.keys(tempValue['_state']).length > 0
                    ? tempValue['_state']
                    : {};
            tempValue['_state']['fields'] = {
                ...tempValue['_state']['fields'],
                tooltip: tooltips,
            };
            // const spec = data.option;
            // spec['series'][0]['label']['name'] = event.target.value;
            setTooltip(tooltips);
            setValue(JSON.stringify(tempValue));
            setData('option', tempValue);
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
                        value={
                            data?.frame?.name == '' ? null : data?.frame?.name
                        }
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
                    <BaseSettingSection label="label">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ''}
                            value={dataLabel ? dataLabel : ''}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value) => {
                                // update the frame
                                handleChangeLabel(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select label"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="X-Axis">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ''}
                            value={xAxisValue ? xAxisValue : ''}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value) => {
                                // update the frame
                                handleChangeXAxis(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select X-Axis"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="Y-Axis">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ''}
                            value={yAxisValue ? yAxisValue : ''}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value) => {
                                // update the frame
                                handleChangeYAxis(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select Y-Axis"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="size">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ''}
                            value={size ? size : ''}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value) => {
                                // update the frame
                                handleChangeSize(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select size"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="color">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ''}
                            value={color ? color : ''}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value) => {
                                // update the frame
                                handleChangeColor(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select color"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    {/* <BaseSettingSection label='Tooltip'>
                        <Autocomplete
                        size="small"
                            fullWidth
                            multiple={false}
                            disabled = {data.frame.name ===""}
                            value={tooltip ? tooltip : ''}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value) => {
                                // update the frame
                                handleChangeTooltip(value);
                            }}
                            freeSolo={false} 
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select tooltip"
                                size="small"
                                variant="outlined"
                                
                            />
                        )}
                            
                        />
                </BaseSettingSection> */}
                </Stack>
                {/* <Stack direction={'column'} width={'100%'} overflow={'hjdden'}>
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
                                            <ScatterPlotBlockSettingsItem
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
                </Stack> */}
            </>
        );
    },
);
