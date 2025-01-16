import { observer } from 'mobx-react-lite';
import { useBlock, useBlocks, useBlockSettings, useFrame } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import EChartsReact from 'echarts-for-react';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { ChartContextMenu } from './ChartContextMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BAR_CHART_DATA } from '../../Visualization.constants';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));
const StyledMainContainer = styled('div')(({ theme }) => ({
    height: '50%',
    width: '50%',
    color: 'unset',
}));
const StyledSubContainer = styled('div')(({ theme }) => ({}));

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: 'inherit',
    width: 'inherit',
    maxHeight: '30vh',
    maxWidth: '80vh',
    display: 'flex',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
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
    const { state } = useBlocks();
    let resultData: unknown = {};
    console.log('state', state);

    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    window.onresize = () => {
        console.log('resize detected');
    };
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
            console.log('echartInstance', echartInstance);
            if (Object.keys(selectedChart).length == 0) {
                setSelectedChart(echartInstance);
            }
            echartInstance.getZr().on('contextmenu', function (params) {
                console.log('contextmenu', 'rightclicked');
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
                } else {
                    chartOperationData.current.contextMenu = null;
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
            echartInstance.on('click', function (e) {
                console.log('click event');
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
        ?.map((c, index) => {
            //Converting Y axis columns to Average by default
            return index > 0 ? `Average(${c.selector})` : c.selector;
        })
        .join(', ')}).as([${data.columns
        ?.map((c, index) => {
            return c.name;
        })
        .join(', ')}])|Group(${data.columns?.[0]?.name})`;

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
            yAxisAdditional: frameResult.values.map((item) => {
                return item[2] ? item[2] : '';
            }),
        };
    }
    //update frame values to the series data when frame values are changed
    const receiveValueswithCorrections = useCallback(
        (dataOption: unknown) => {
            // const optionDataProcessed = processReceivedData(frameData.data);
            resultData = dataOption;
            let frameDataIndex = 0;
            //setting xaxis data
            resultData['xAxis']['data'] = frameData.data?.values?.map(
                (item, index) => {
                    return { value: item[frameDataIndex] };
                },
            );
            let optionSeriesLength = frameData.data.headers.length;
            frameDataIndex++;
            let seriesIndex =
                resultData['series'].findIndex((item) =>
                    BAR_CHART_DATA.JSONVALUE.includes(item.type),
                ) || 0;
            //setting all values to all existing series to null, to restore the chart to initial state so new values will be updated
            for (
                let seriesIdx = 0;
                seriesIdx < resultData['series'].length;
                seriesIdx++
            ) {
                if (
                    resultData['series'][seriesIdx] !== undefined &&
                    resultData['series'][seriesIdx].hasOwnProperty('data') &&
                    !resultData['series'][seriesIdx].hasOwnProperty(
                        'toggleTrendLineObject',
                    )
                ) {
                    resultData['series'][seriesIdx]['data'] =
                        frameData.data?.values?.map((item, index) => {
                            return { value: null };
                        });
                }
            }
            //setting new values to series
            let i;
            for (i = frameDataIndex; i < optionSeriesLength; i++) {
                if (
                    resultData['series'][i - 1] !== undefined &&
                    resultData['series'][i - 1].hasOwnProperty('data') &&
                    !resultData['series'][i - 1].hasOwnProperty(
                        'toggleTrendLineObject',
                    )
                ) {
                    console.log('frameData Values');
                    frameData.data?.values?.forEach((item, index) => {
                        console.log({ value: item[i] ?? null });
                    });
                    resultData['series'][i - 1]['data'] =
                        frameData.data?.values?.map((item, index) => {
                            return { value: item[i] ?? null };
                        });
                }
            }
            // if(resultData['series'].length >= optionSeriesLength){
            //     for(let seriesIdx=optionSeriesLength; seriesIdx<=resultData['series'].length; seriesIdx++){
            //         if(resultData['series'][(seriesIdx-1)]!==undefined && resultData['series'][(seriesIdx-1)].hasOwnProperty('data')){
            //             resultData['series'][(seriesIdx-1)]['data'] = frameData.data?.values?.map((item,index)=>{
            //                 return { 'value': (null)};
            //             });
            //         }
            //     }
            // }
            //resetting the old records or unmodified records
            // if(resultData['series'][(i-1)]['data'].length){
            //     resultData['series'][(i-1)]['data'] = resultData['series'][(i-1)].data.map((item,index)=>null);
            // }
            // console.log('seriesLength', optionSeriesLength);
            return resultData; //returning updated values to chart
        },
        [frameData.data.values],
    );
    // console.log('option', data.option, frameData.data);
    // if (
    //     data.option.hasOwnProperty('customSettings') &&
    //     !data.option['customSettings']['optionStateChange']
    // )
    // const updateFrameData = () => {
    // if(data.frame.name && frameData.data){
    // resultData['series'] = seriesToUpdate;
    // data.option['series'] = [optionDataProcessed['yAxis'], ...arrayToAdd];
    // };
    // }
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
    // if (frameData.data?.values?.length) {
    //     updateFrameData();
    // }
    //validating the received data.option is in string format and parse it and then assign the same to chart
    if (typeof data.option === 'string') {
        try {
            const options = JSON.parse(data.option);
            return (
                <StyledMainContainer id={id}>
                    <EChartsReact option={options} />
                </StyledMainContainer>
            );
        } catch (e) {
            return (
                <StyledMainContainer>
                    There is an issue parsing your JSON.
                </StyledMainContainer>
            );
        }
    } else {
        //assign the data from frame to exising object based on frame is selected or not
        resultData = data.frame.name
            ? receiveValueswithCorrections(data.option)
            : data.option;
        return (
            <StyledMainContainer id={id}>
                <EChartsReact
                    option={resultData}
                    onChartReady={echartsLoaded}
                />
                <ChartContextMenu
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
    }
});
