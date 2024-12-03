import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
    useBlock,
    useBlockSettings,
    useFrame,
    useFrameHeaders,
    usePixel,
} from '@/hooks';
import { EChartVisualizationBlockDef } from './EChartVisualizationBlock';
import EChartsReact from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { computed } from 'mobx';
import { ActionMessages } from '@/stores';
import { BlocksContext } from '@/contexts';
import { styled } from '@semoss/ui';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import { BAR_CHART_DATA } from './Echart.constants';
import { Paths, PathValue } from '@/types';
import { EChartContextMenu } from './EChartContextMenu';
import { observer } from 'mobx-react-lite';
import { getValueByPath } from '@/utility';

const StyledMainContainer = styled('div')(({ theme }) => ({}));
const StyledSubContainer = styled('div')(({ theme }) => ({}));

export interface EChartContainerProps {
    id: string;
    // updateChartData: ()=>{}
}

//Main Container for holding the EchartComponent
const EChartContainer = observer<EChartContainerProps>(({ id }) => {
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    const [selectedChart, setSelectedChart] = useState<any>({});
    const [echartState, setEchartState] = useState<any>({});
    const { data, setData } = useBlockSettings<EChartVisualizationBlockDef>(id);

    const path = 'option';
    let latestOption = useRef();
    let chartOperationData = useRef({
        brushSelected: [],
        contextMenu: null,
        yAxisColumn: { name: '', selector: '', width: undefined },
        chartInstance: { setOption: null },
    });
    // track the ref to debounce the input
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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

    //Custom object to define and handle different events, later current instance setup will be updated to onEvents object
    const handleChartEvents = {};

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
                    const seriesData = option['series'][seriesIndex] || {};
                    let dataToFind = seriesData['data'];
                    let filteredData = dataToFind.filter((item, index) =>
                        dataIndex.includes(index),
                    );
                    chartOperationData.current.brushSelected = filteredData;
                    chartOperationData.current.yAxisColumn = {
                        ...chartOperationData.current.yAxisColumn,
                        name: option['yAxis']['name'],
                        selector: option['yAxis']['name'],
                    };
                }
            });
        }
    }, [echartState]);

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
    const optionDataProcessed = processReceivedData(frameData.data);
    data.option['xAxis']['data'] = optionDataProcessed['xAxis'];
    data.option['series'][0]['data'] = optionDataProcessed['yAxis'];

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
    return (
        <StyledMainContainer id={id}>
            <EChartsReact
                option={data.option}
                onChartReady={echartsLoaded}
                // onEvents={handleChartEvents}
            />
            <EChartContextMenu
                id={id}
                frame={frameData}
                contextMenu={chartOperationData.current.contextMenu}
                chartInstance={chartOperationData.current.chartInstance}
                onClose={() => {
                    chartOperationData.current.contextMenu = null;
                }}
            />
        </StyledMainContainer>
    );
});

export default EChartContainer;
