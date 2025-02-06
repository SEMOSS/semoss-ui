import { observer } from 'mobx-react-lite';
import { useBlockSettings, useFrame } from '@/hooks';
import { styled } from '@mui/material';
import * as echarts from 'echarts/core';
import EChartsReact from 'echarts-for-react';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { ChartContextMenu } from './ChartContextMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
//Main Container for displaying Bar chart
const StyledMainContainer = styled('div')(({ theme }) => ({
    height: 'inherit',
    width: 'inherit',
}));
//container for displaying invalid or no data
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
//echart field structure
export interface EChartColumns {
    name: string;
    selector: string;
    width: string;
}
//bar component properties
interface BarProps {
    id: string;
}

export const Bar: any = observer<BarProps>(({ id }) => {
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [echartState, setEchartState] = useState<any>({});
    // const [selectedChart, setSelectedChart] = useState<any>({});
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number; //x axis position for the click/brush event
        mouseY: number; //y axis position for the click/brush event
        value: unknown; //value can be of object or any type
    } | null>(null);
    let resultData: unknown = {};
    //selector string construction based on fields selection
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
    //frame object
    const frameData = useFrame(data.frame.name, {
        selector: selector,
    });

    let chartOperationData = useRef({
        brushSelected: [],
        contextMenu: null,
        yAxisColumn: { name: '', selector: '', width: undefined },
        chartInstance: { setOption: null },
    });

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
    //on events object for getting and processing events with chart
    const onClickChart = {
        //when contextmenu event is raised, default context menu made hidden, and custom component is shown
        contextmenu: (params) => {
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
        //After brushing in bar chart, this event will be triggered to filter the selected data
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
        //this event will be triggered when bar data is being selected
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
                        width: 'inherit',
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
