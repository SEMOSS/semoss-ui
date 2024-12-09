import { observer } from 'mobx-react-lite';
import { EChartVisualizationBlockDef } from './EChartVisualizationBlock';
import { useBlock, useFrame } from '@/hooks';
import { Menu, MenuItem } from '@mui/material';
import { PathValue } from 'react-hook-form';
import { useEffect, useRef } from 'react';

export interface EChartContextMenuProps {
    id: string;
    frame: ReturnType<typeof useFrame>;
    contextMenu: {
        mouseX: number;
        mouseY: number;
        column: {
            name: string;
            selector: string;
            // width: string;
        };
        value: unknown[];
    } | null;
    chartInstance: any;
    onClose: () => void;
}
//Open this contextmenu when right click event is triggered
export const EChartContextMenu: React.FC<EChartContextMenuProps> = observer(
    ({ id, frame, contextMenu, chartInstance, onClose }) => {
        const { data, setData } = useBlock<EChartVisualizationBlockDef>(id);
        let currentOperation = useRef({
            unfilterActive: false,
            filterActive: false,
            excludeActive: false,
        });
        //Checking the current action state for filtering and unfiltering to set and update the data to chart using setoption and setData
        useEffect(() => {
            if (frame.isLoading === false && frame.error === undefined) {
                if (currentOperation.current.unfilterActive) {
                    try {
                        let optionDataProcessed = processReceivedData(
                            frame.data,
                        );
                        data.option['xAxis']['data'] =
                            optionDataProcessed['xAxis'];
                        data.option['series'][0]['data'] =
                            optionDataProcessed['yAxis'];
                        setData('option', data.option as PathValue<any, any>);
                        if (chartInstance.setOption !== null) {
                            chartInstance.setOption(data.option);
                            currentOperation.current.unfilterActive = false;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
                if (currentOperation.current.filterActive) {
                    try {
                        let optionDataProcessed = processReceivedData(
                            frame.data,
                        );
                        data.option['xAxis']['data'] =
                            optionDataProcessed['xAxis'];
                        data.option['series'][0]['data'] =
                            optionDataProcessed['yAxis'];
                        setData('option', data.option as PathValue<any, any>);
                        if (chartInstance.setOption !== null) {
                            chartInstance.setOption(data.option);
                            currentOperation.current.filterActive = false;
                            contextMenu = {
                                ...contextMenu,
                                ['value']: null,
                            };
                            disableSelection();
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
                if (currentOperation.current.excludeActive) {
                    try {
                        let optionDataProcessed = processReceivedData(
                            frame.data,
                        );
                        data.option['xAxis']['data'] =
                            optionDataProcessed['xAxis'];
                        data.option['series'][0]['data'] =
                            optionDataProcessed['yAxis'];
                        setData('option', data.option as PathValue<any, any>);
                        if (chartInstance.setOption !== null) {
                            chartInstance.setOption(data.option);
                            currentOperation.current.excludeActive = false;
                            contextMenu = {
                                ...contextMenu,
                                ['value']: null,
                            };
                            disableSelection();
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        }, [frame.data]);
        //run disable selection in a delay after filter action is completed
        function disableSelection() {
            setTimeout(() => {
                chartInstance.dispatchAction({
                    type: 'brush',
                    areas: [],
                });
            }, 500);
        }
        //convert the received data from frame and update the data in the format for setting to chart
        function processReceivedData(frameResult) {
            return {
                xAxis: frameResult.values.map((item) => {
                    return item[0];
                }),
                yAxis: frameResult.values.map((item) => {
                    return item[1];
                }),
            };
        }
        console.log(contextMenu, data.contextMenu);
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
                            let optionUp = data.option;
                            const reUpdate = data.option['series'];
                            optionUp = {
                                ...optionUp,
                                ['series']: null,
                            };
                            try {
                                setData(
                                    'option',
                                    optionUp as PathValue<any, any>,
                                );
                                currentOperation.current.unfilterActive = true;
                                // checkUnfilterOperation(data.option);
                            } catch (e) {
                                console.log(e);
                            }

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
                            let optionUp = data.option;
                            const reUpdate = data.option['series'];
                            optionUp = {
                                ...optionUp,
                                ['series']: null,
                            };
                            setData('option', optionUp as PathValue<any, any>);
                            currentOperation.current.filterActive = true;
                            // runSeriesUpdate(reUpdate);
                            onClose();
                        }}
                    >
                        Filter {contextMenu.column.name} ==
                        {typeof contextMenu.value === 'string'
                            ? contextMenu.value
                            : JSON.stringify(contextMenu.value)}
                    </MenuItem>
                ) : null}
                {contextMenu &&
                !data.contextMenu?.hideExclude &&
                contextMenu.value.length === 1 ? (
                    <MenuItem
                        dense={true}
                        value={'exclude'}
                        onClick={() => {
                            frame.filter(
                                `SetFrameFilter(${
                                    contextMenu.column.selector
                                }!="${contextMenu.value.toString()}")`,
                            );
                            let optionUp = data.option;
                            const reUpdate = data.option['series'];
                            optionUp = {
                                ...optionUp,
                                ['series']: null,
                            };
                            setData('option', optionUp as PathValue<any, any>);
                            currentOperation.current.excludeActive = true;
                            // runSeriesUpdate(reUpdate);
                            onClose();
                        }}
                    >
                        Exclude {contextMenu.column.name} !=
                        {typeof contextMenu.value === 'string'
                            ? contextMenu.value
                            : contextMenu.value}
                    </MenuItem>
                ) : null}
            </Menu>
        );
    },
);
