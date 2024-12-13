import { observer } from 'mobx-react-lite';
import { useBlock, useBlockSettings, useFrame } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import EChartsReact from 'echarts-for-react';
import { EchartVisualizationBlockDef } from '../../EchartVisualizationBlock';
import { EChartContextMenu } from './EChartContextMenu';
import { useEffect, useRef, useState } from 'react';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));
const StyledMainContainer = styled('div')(({ theme }) => ({}));
const StyledSubContainer = styled('div')(({ theme }) => ({}));

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '30vh',
    width: '80vh',
    color: error ? theme.palette.error.main : 'unset',
}));

export interface EChartColumns {
    name: string;
    selector: string;
    width: string;
}

export const Bar: BlockComponent = observer(({ id }) => {
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [echartState, setEchartState] = useState<any>({});
    const [selectedChart, setSelectedChart] = useState<any>({});

    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    //run perform operations when the echarts component is loaded
    useEffect(() => {
        let limit = 200,
            limitStart = 0;
        let echartElementId = document.getElementById(id);
        let canvasElement: any = echartElementId.getElementsByTagName('CANVAS');
        if (!canvasElement.length) {
            return;
        }
        canvasElement = canvasElement[0];
        let echartInstance = undefined;
        while (!echartInstance && limitStart < limit) {
            if (echarts.getInstanceByDom(canvasElement)) {
                echartInstance = echarts.getInstanceByDom(canvasElement);
            } else if (canvasElement.id === id) {
                break;
            } else {
                canvasElement = canvasElement.parentElement;
            }
            limitStart++;
        }
        if (echartInstance) {
            chartOperationData.current.chartInstance = echartInstance;
            if (Object.keys(selectedChart).length == 0) {
                setSelectedChart(echartInstance);
            }
            echartInstance.getZr().on('contextmenu', function (params) {
                if (chartOperationData.current.brushSelected !== null) {
                    chartOperationData.current.contextMenu = {
                        mouseX: params.event.clientX,
                        mouseY: params.event.clientY,
                        column: chartOperationData.current.yAxisColumn,
                        value: chartOperationData.current.brushSelected,
                    };
                    handleSelection(
                        chartOperationData.current.yAxisColumn.name,
                        chartOperationData.current.brushSelected,
                    );
                }
            });
            echartInstance.on('contextmenu', function (params) {
                console.log(params, 'right click');
                if (chartOperationData.current.brushSelected === null) {
                    let dataIndex = params.dataIndex;
                    let option = data.option;
                    chartOperationData.current.yAxisColumn = {
                        name: option['xAxis']['pixelname'] ?? '',
                        selector: option['xAxis']['pixelvalue'] ?? '',
                        width: undefined,
                    };
                    chartOperationData.current.contextMenu = {
                        mouseX: params['event']?.event?.clientX,
                        mouseY: params['event']?.event?.clientY,
                        column: chartOperationData.current.yAxisColumn,
                        value: option['xAxis']['data'][dataIndex],
                    };
                    handleSelection(
                        chartOperationData.current.yAxisColumn.name,
                        chartOperationData.current.brushSelected,
                    );
                }
            });
            echartInstance.on('dblclick', function (e) {
                return;
            });
            echartInstance.on('brushselected', function (params) {
                let dataIndex = [];
                let seriesIndex = -1;
                let selectedData = [];
                if (
                    params.hasOwnProperty('batch') &&
                    params?.batch?.length > 0
                ) {
                    params.batch.forEach((item) => {
                        selectedData = item.selected;
                        if (Array.isArray(selectedData)) {
                            selectedData.forEach((selectedItem) => {
                                dataIndex = selectedItem.dataIndex;
                                seriesIndex = selectedItem.seriesIndex;
                            });
                        }
                    });
                }
                let option = data.option;
                if (
                    seriesIndex > -1 &&
                    dataIndex.length > 0 &&
                    selectedData.length > 0
                ) {
                    //This is for x Axis values filtering
                    let axisData = option['xAxis']['data'];
                    let axisFilteredData = axisData.filter((item, index) =>
                        dataIndex.includes(index),
                    );
                    console.log(axisFilteredData, 'filteredData');
                    let axisFilteredValues = [];
                    axisFilteredData.forEach((item, index) => {
                        if (
                            typeof item === 'string' ||
                            typeof item === 'number'
                        ) {
                            axisFilteredValues.push(item);
                        } else {
                            if (item.hasOwnProperty('value') && item?.value) {
                                axisFilteredValues.push(item.value);
                            }
                        }
                    });
                    chartOperationData.current.brushSelected =
                        axisFilteredValues || [];
                    chartOperationData.current.yAxisColumn = {
                        ...chartOperationData.current.yAxisColumn,
                        name: option['xAxis']['pixelname'],
                        selector: option['xAxis']['pixelname'],
                    };
                }
            });
        }
    }, [echartState]);

    const path = 'option';
    const selector = `Select(${data.columns
        ?.map((c) => {
            return c.selector;
        })
        .join(', ')}).as([${data.columns
        ?.map((c) => {
            return c.name;
        })
        .join(', ')}])`;

    const frameData = useFrame(data.frame.name, {
        selector: selector,
    });

    //Based on the brushselection data filter query will run in a specific debounce time
    const handleSelection = debounce((column, value) => {
        frameData.filter(`SetFrameFilter(${column}==[${value}])`);
    }, 500);

    let latestOption = useRef();
    let chartOperationData = useRef({
        brushSelected: [],
        contextMenu: null,
        yAxisColumn: { name: '', selector: '', width: undefined },
        chartInstance: { setOption: null },
    });
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
    console.log('option', data.option, frameData.data);
    // if (
    //     data.option.hasOwnProperty('customSettings') &&
    //     !data.option['customSettings']['optionStateChange']
    // )
    const tempFunc = () => {
        const optionDataProcessed = processReceivedData(frameData.data);
        data.option['xAxis']['data'] = optionDataProcessed['xAxis'];
        data.option['series'][0]['data'] = optionDataProcessed['yAxis'];
    };
    //this function is automatically called, when the chart is ready
    function echartsLoaded(echartInstance) {
        if (!echartState.hasOwnProperty('chartLoaded')) {
            setEchartState((prevState) => {
                return {
                    ...prevState,
                    ['chartLoaded']: true,
                };
            });
        }
    }
    if (frameData.data?.values?.length) {
        tempFunc();
    }
    return (
        <StyledMainContainer id={id}>
            <EChartsReact option={data.option} onChartReady={echartsLoaded} />
            <EChartContextMenu
                id={id}
                frame={frameData}
                contextMenu={chartOperationData.current.contextMenu}
                chartInstance={chartOperationData.current.chartInstance}
                onClose={() => {
                    chartOperationData.current.contextMenu = null;
                    chartOperationData.current.yAxisColumn = null;
                    chartOperationData.current.brushSelected = null;
                }}
            />
        </StyledMainContainer>
    );
});
