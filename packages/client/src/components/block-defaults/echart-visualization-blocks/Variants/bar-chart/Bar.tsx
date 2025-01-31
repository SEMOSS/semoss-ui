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
    height: 'inherit',
    // width: 'inherit',
    // color: 'unset',
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

interface BarProps {
    id: string;
    updateChartData: any;
}

export const Bar: any = observer<BarProps>(({ id, updateChartData }) => {
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
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);
    const [value, setValue] = useState({});
    const { state } = useBlocks();
    let resultData: unknown = {};

    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    window.onresize = () => {
        console.log('resize detected');
    };

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
            echartInstance.on('click', function (e) {
                console.log('click event');
                return;
            });
            echartInstance.getZr().on('click', function (e) {
                console.log('click event');
                return;
            });
        }
    }, [echartState, frameData.data.values]);

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
    function getData() {
        return data.option;
    }
    //update frame values to the series data when frame values are changed
    const receiveValueswithCorrections = useCallback(
        (resultData: unknown) => {
            let frameDataIndex = 0;
            //setting xaxis data
            resultData['xAxis']['data'] = frameData.data?.values?.map(
                (item, index) => {
                    return { value: item[frameDataIndex] };
                },
            );
            let optionSeriesLength = frameData.data.headers.length;
            frameDataIndex++;
            // let seriesIndex =
            //     resultData['series'].findIndex((item) =>
            //         BAR_CHART_DATA.JSONVALUE.includes(item.type),
            //     ) || 0;
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
                    resultData['series'][i - 1]['data'] =
                        frameData.data?.values?.map((item, index) => {
                            return { value: item[i] ?? null };
                        });
                }
            }
            return resultData; //returning updated values to chart
        },
        [frameData.data.values],
    );

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
    const onClickChart = {
        contextmenu: (params) => {
            //  let currentOption = chart.getOption();
            if (params.data) {
                let xAxisName = data.option['xAxis']['pixelvalue'][0];
                let xAxisValue =
                    typeof data.option['xAxis']['data'][params.dataIndex] ==
                        'object' &&
                    data.option['xAxis']['data'][
                        params.dataIndex
                    ].hasOwnProperty('value')
                        ? data.option['xAxis']['data'][params.dataIndex][
                              'value'
                          ]
                        : data.option['xAxis']['data'][params.dataIndex];
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: params.event.event.clientX,
                              mouseY: params.event.event.clientY,
                              value: {
                                  name: xAxisName,
                                  value: xAxisValue,
                              },
                          }
                        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                          // Other native context menus might behave different.
                          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                          null,
                );
                params.event.event.preventDefault();
            } else {
                params.event.event.preventDefault();
            }
        },
        brushend: (params) => {
            let batch = params.batch;
            let xAxisName = data.option['xAxis']['pixelvalue'][0];
            let xAxisValue = chartOperationData.current.brushSelected.map(
                (item) =>
                    typeof item === 'object' && item.hasOwnProperty('value')
                        ? item['value']
                        : item,
            );
            frameData.filter(
                `SetFrameFilter(${xAxisName}==${JSON.stringify(xAxisValue)})`,
            );
        },
        brushselected: (params) => {
            let batch = params.batch;
            if (batch.length) {
                let firstBatch = batch[0];
                let selectedData = firstBatch.selected;
                let firstSelectedData = selectedData[0] || [];
                let xAxisData = data.option['xAxis']['data'].filter(
                    (item, index) =>
                        firstSelectedData.dataIndex.includes(index),
                );
                chartOperationData.current.brushSelected = xAxisData;
            }
        },
    };

    //validating the received data.option is in string format and parse it and then assign the same to chart
    if (typeof data.option === 'string') {
        try {
            const options = JSON.parse(data.option);
            return (
                <StyledNoDataContainer id={id}>
                    <EChartsReact option={options} />
                </StyledNoDataContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer>
                    There is an issue parsing your JSON.
                </StyledNoDataContainer>
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
                    onEvents={onClickChart}
                    style={{
                        height: 'inherit',
                        // width: 'inherit'
                    }}
                />
                <ChartContextMenu
                    id={id}
                    frame={frameData}
                    contextMenu={contextMenu}
                    chartInstance={chartOperationData.current.chartInstance}
                    onClose={() => {
                        chartOperationData.current.contextMenu = null;
                        chartOperationData.current.yAxisColumn = null;
                        chartOperationData.current.brushSelected = null;
                        setContextMenu(null);
                    }}
                />
            </StyledMainContainer>
        );
    }
});
