import { BaseSettingSection } from '@/components/block-settings';
import {
    useBlockSettings,
    useBlocksPixel,
    useFrame,
    useFrameHeaders,
} from '@/hooks';
import {
    Autocomplete,
    IconButton,
    List,
    Stack,
    TextField,
    useNotification,
} from '@semoss/ui';
import {
    EChartVisualizationBlockDef,
    EChartColumns,
} from './EChartVisualizationBlock';
import { Sync } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Delete } from '@mui/icons-material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BAR_CHART_DATA } from './Echart.constants';
import { PathValue } from '@/types';

export const FrameDataSection = ({ id, updateChart }) => {
    console.log('frame');
    const { data, setData } = useBlockSettings<EChartVisualizationBlockDef>(id);
    const [frameName, setFrameName] = useState('');
    const notification = useNotification();
    // get all of the frames
    const getFrames = useBlocksPixel<string[]>('GetFrames();', {
        data: [],
    });
    // get headers associated with the selected frames
    const frameHeaders = useFrameHeaders(frameName);
    let selector = `Select(${data?.columns
        ?.map((c) => {
            return c.selector;
        })
        .join(', ')}).as([${data?.columns
        ?.map((c) => {
            return c.name;
        })
        .join(', ')}])`;
    const frameData = useFrame(data.frame?.name, {
        selector: selector,
        // offset:0,
        // limit: 10,
        // enableCount: true
    });

    if (
        !frameData.isLoading &&
        frameData.data['values'].length > 0
        // &&
        // currentFrame !== dataOption.frame?.name
    ) {
        let tempFrameData = frameData;
        let dataArray = {
            headerData: tempFrameData['data']['headers'],
            values: {},
        };
        tempFrameData['data']['headers']?.forEach((item, index) => {
            dataArray['values'][item] = [];
        });
        tempFrameData['data']['values'].forEach((item, index) => {
            item.forEach((subItem, subIndex) => {
                dataArray['values'] = {
                    ...dataArray['values'],
                    [tempFrameData['data']['headers'][subIndex]]: [
                        item[subIndex],
                        ...dataArray['values'][
                            tempFrameData['data']['headers'][subIndex]
                        ],
                    ],
                };
            });
        });

        // let option = data.option;
        let xAxisIndex = tempFrameData['data']['headers'][1] ?? 'data 1',
            yAxisIndex = tempFrameData['data']['headers'][0] ?? 'data 2';

        // chartOperationData.current.yAxisColumn = {
        //     ...chartOperationData.current.yAxisColumn,
        //     ['name']:yAxisIndex,
        //     ['selector']: data.columns[data.columns.findIndex((col)=>col.name === yAxisIndex)]['selector'] ?? '',
        // };
        // console.log('yAxis', chartOperationData.current);
        getOptions(xAxisIndex, yAxisIndex, dataArray);
        // updateChart(option);
        // data.option = data.option;
        // updateChartData(dataOption.frame?.name, option);
        // setTimeout(()=>{
        try {
            setData('option', data.option as PathValue<any, any>);
        } catch (e) {
            console.log('exception', e);
        }
        // },200);
    }
    function getOptions(xAxisIndex, yAxisIndex, dataArray) {
        if (data.option.hasOwnProperty('xAxis') && data.option['xAxis']) {
            data.option['xAxis'] = {
                ...data.option['xAxis'],
                ['data']: dataArray['values'][xAxisIndex],
                ['name']: xAxisIndex,
            };
        }
        if (data.option.hasOwnProperty('yAxis') && data.option['yAxis']) {
            data.option['yAxis'] = {
                ...data.option['yAxis'],
                ['name']: yAxisIndex,
            };
        }
        if (data.option.hasOwnProperty('series') && data.option['series']) {
            let seriesDataIndex = data.option['series'].findIndex(
                (item) => item.type === BAR_CHART_DATA.JSONVALUE[0],
            );
            data.option['series'][seriesDataIndex] = {
                ...data.option['series'][seriesDataIndex],
                ['data']: dataArray['values'][yAxisIndex],
            };
        }
    }

    /**
     * Sync the columns with the frame headers
     */
    const syncFrameHeaders = () => {
        try {
            // get the columns by selector
            // const columnMap: Record<string, EChartColumns> =
            //     data.columns.reduce((acc, val) => {
            //         acc[val.name] = acc;

            //         return acc;
            //     }, {});
            console.log(frameHeaders, 'frameHeaders on Sync');
            const columnMap: Record<string, EChartColumns> = {};
            // get the frameHeaders as columns
            const columns: EChartColumns[] = frameHeaders.data.list.map((h) => {
                return {
                    name: h.alias,
                    width: undefined,
                    // add the previous if it exists
                    ...JSON.parse(JSON.stringify(columnMap[h.alias] || {})),
                    selector: h.header,
                };
            });

            // update the data
            setData('columns', columns);

            notification.add({
                color: 'success',
                message: 'Succesfully synchronized headers',
            });
            // updateChart();
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    // options for the autocomplete
    const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];
    // Columns to render
    const columns = data.columns || [];

    const reorderColumns = (startDragIndex: number, stopDragIndex: number) => {
        // get the columns
        const columns = [...data.columns];

        // remove it
        const [removed] = columns.splice(startDragIndex, 1);

        // add it at the new location
        columns.splice(stopDragIndex, 0, removed);

        // update the data
        setData('columns', columns);
    };

    useEffect(() => {
        if (data.hasOwnProperty('frame')) {
            if (!data.frame.hasOwnProperty('name')) {
                setData('frame.name', '');
            }
        } else {
            setData('frame.name', '');
        }
    }, []);

    return (
        <>
            <BaseSettingSection label="Frame">
                <Autocomplete
                    fullWidth
                    multiple={false}
                    disabled={getFrames.status !== 'SUCCESS'}
                    value={data.frame?.name}
                    options={options}
                    getOptionLabel={(option) => {
                        return option;
                    }}
                    onChange={(_, value) => {
                        // update the frame
                        setData('frame.name', value);
                        setFrameName(value);
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
                                {data?.columns?.map((c, cIdx) => {
                                    return (
                                        <Draggable
                                            draggableId={`grid-column--${cIdx}`}
                                            index={cIdx}
                                        >
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
                                                                disabled={
                                                                    snapshot.isDragging
                                                                }
                                                                size="small"
                                                                onClick={() => {
                                                                    // get the columns except the current one
                                                                    const columns =
                                                                        data.columns.filter(
                                                                            (
                                                                                v,
                                                                                idx,
                                                                            ) =>
                                                                                cIdx !==
                                                                                idx,
                                                                        );

                                                                    // update the data
                                                                    setData(
                                                                        'columns',
                                                                        columns,
                                                                    );
                                                                }}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </>
                                                    }
                                                >
                                                    <List.ItemText
                                                        primary={c.name}
                                                        secondary={c.selector}
                                                        primaryTypographyProps={{
                                                            title: c.name,
                                                            style: {
                                                                whiteSpace:
                                                                    'nowrap',
                                                                overflow:
                                                                    'hidden',
                                                                textOverflow:
                                                                    'ellipsis',
                                                            },
                                                        }}
                                                        secondaryTypographyProps={{
                                                            title: c.selector,
                                                            style: {
                                                                whiteSpace:
                                                                    'nowrap',
                                                                overflow:
                                                                    'hidden',
                                                                textOverflow:
                                                                    'ellipsis',
                                                            },
                                                        }}
                                                    />
                                                </List.Item>
                                            )}
                                        </Draggable>
                                    );
                                })}
                            </List>
                        )}
                    </Droppable>
                </DragDropContext>
            </Stack>
        </>
    );
};
