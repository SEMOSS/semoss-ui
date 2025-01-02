import { observer } from 'mobx-react-lite';

import { useBlock, useBlockSettings, useFrame } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import EChartsReact from 'echarts-for-react';
import { useEffect, useRef, useState } from 'react';
import { VizBlockContextMenu } from '../VizBlockContextMenu';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));

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

export interface EchartVisualizationBlockDef {
    widget: 'e-chart';
    data: {
        option: {};
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: EChartColumns[];
        contextMenu: {
            hideUnfilter: boolean;
            hideFilter: boolean;
            hideExclude: boolean;
        };
    };
    listeners: {};
    slots: never;
}

export const ScatterPlotBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);

    const [processedFrameData1, setProcessedFrameData] = useState<any>();
    // const chartRef = useRef(null);
    function getSelector() {
        let selector = '';
        if (data.hasOwnProperty('columns')) {
            if (data.option.hasOwnProperty('_state')) {
                if (data.option['_state'].hasOwnProperty('fields')) {
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${data.option['series'][0]['label']['name']},Average(${data.option['xAxis']['pixelName']}),Average(${data.option['yAxis']['pixelName']}),Average(${data.option['_state']['fields']['size']}),(${data.option['_state']['fields']['color']}),Average(${data.option['_state']['fields']['tooltip']})).as([${data.option['series'][0]['label']['name']}, ${data.option['xAxis']['pixelName']},${data.option['yAxis']['pixelName']},${data.option['_state']['fields']['size']},${data.option['_state']['fields']['color']},${data.option['_state']['fields']['tooltip']}])|Group(${data.option['series'][0]['label']['name']},${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${data.option['series'][0]['label']['name']},Average(${data.option['xAxis']['pixelName']}),Average(${data.option['yAxis']['pixelName']}),Average(${data.option['_state']['fields']['size']}),(${data.option['_state']['fields']['color']})).as([${data.option['series'][0]['label']['name']}, ${data.option['xAxis']['pixelName']},${data.option['yAxis']['pixelName']},${data.option['_state']['fields']['size']},${data.option['_state']['fields']['color']}])|Group(${data.option['series'][0]['label']['name']},${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${data.option['series'][0]['label']['name']},Average(${data.option['xAxis']['pixelName']}),Average(${data.option['yAxis']['pixelName']}),(${data.option['_state']['fields']['color']}),Average(${data.option['_state']['fields']['tooltip']})).as([${data.option['series'][0]['label']['name']}, ${data.option['xAxis']['pixelName']},${data.option['yAxis']['pixelName']},${data.option['_state']['fields']['color']},${data.option['_state']['fields']['tooltip']}])|Group(${data.option['series'][0]['label']['name']},${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${data.option['series'][0]['label']['name']},Average(${data.option['xAxis']['pixelName']}),Average(${data.option['yAxis']['pixelName']}),Average(${data.option['_state']['fields']['size']}),Average(${data.option['_state']['fields']['tooltip']})).as([${data.option['series'][0]['label']['name']}, ${data.option['xAxis']['pixelName']},${data.option['yAxis']['pixelName']},(${data.option['_state']['fields']['size']},${data.option['_state']['fields']['tooltip']}])|Group(${data.option['series'][0]['label']['name']})`);
                    }

                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['color']
                    ) {
                        console.log('test12');
                        return (selector = `Select(${data.option['series'][0]['label']['name']},Average(${data.option['xAxis']['pixelName']}),Average(${data.option['yAxis']['pixelName']}),(${data.option['_state']['fields']['color']})).as([${data.option['series'][0]['label']['name']}, ${data.option['xAxis']['pixelName']},${data.option['yAxis']['pixelName']},${data.option['_state']['fields']['color']}])|Group(${data.option['series'][0]['label']['name']},${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['size']
                    ) {
                        console.log('test12');
                        return (selector = `Select(${data.option['series'][0]['label']['name']},Average(${data.option['xAxis']['pixelName']}),Average(${data.option['yAxis']['pixelName']}),Average(${data.option['_state']['fields']['size']})).as([${data.option['series'][0]['label']['name']}, ${data.option['xAxis']['pixelName']},${data.option['yAxis']['pixelName']},${data.option['_state']['fields']['size']}])|Group(${data.option['series'][0]['label']['name']})`);
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['tooltip']
                    ) {
                        console.log('test12');
                        return (selector = `Select(${data.option['series'][0]['label']['name']},Average(${data.option['xAxis']['pixelName']}),Average(${data.option['yAxis']['pixelName']}),Average(${data.option['_state']['fields']['tooltip']})).as([${data.option['series'][0]['label']['name']}, ${data.option['xAxis']['pixelName']},${data.option['yAxis']['pixelName']},${data.option['_state']['fields']['tooltip']}])|Group(${data.option['series'][0]['label']['name']})`);
                    }
                }
            }
            return (selector = `Select(${data.option['series'][0]['label']['name']},Average(${data.option['xAxis']['pixelName']}),Average(${data.option['yAxis']['pixelName']})).as([${data.option['series'][0]['label']['name']}, ${data.option['xAxis']['pixelName']},${data.option['yAxis']['pixelName']}])|Group(${data.option['series'][0]['label']['name']})`);
        }
        return '';
    }

    console.log(data, 'frame');
    function valueToHSL(value) {
        const hue = (parseInt(value, 10) * 37) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }
    const frame = useFrame(data?.frame?.name, {
        selector: getSelector(),
    });
    console.log(data, 'data.option');
    function processData(apiData) {
        if (apiData['values']) {
            if (data.option.hasOwnProperty('_state')) {
                if (data.option['_state'].hasOwnProperty('fields')) {
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['tooltip']
                    ) {
                        console.log('test');
                        return apiData.values.map((item) => ({
                            value: [item[1], item[2]], // x and y values
                            symbolSize: item[3], // Individual symbol size
                            label: {
                                show: true,
                                position: 'top',
                                formatter: item[0].toString(), // Use array[0] as the label
                            },
                            itemStyle: {
                                color: item[4] ? valueToHSL(item[4]) : '#00000',
                            },
                            tooltipValue: item[5],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['color']
                    ) {
                        console.log('test');
                        return apiData.values.map((item) => ({
                            value: [item[1], item[2]], // x and y values
                            symbolSize: item[3], // Individual symbol size
                            label: {
                                show: true,
                                position: 'top',
                                formatter: item[0].toString(), // Use array[0] as the label
                            },
                            itemStyle: {
                                color: item[4] ? valueToHSL(item[4]) : '#00000',
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['tooltip']
                    ) {
                        console.log('test');
                        return apiData.values.map((item) => ({
                            value: [item[1], item[2]], // x and y values
                            label: {
                                show: true,
                                position: 'top',
                                formatter: item[0].toString(), // Use array[0] as the label
                            },
                            itemStyle: {
                                color: item[3] ? valueToHSL(item[3]) : '#00000',
                            },
                            tooltipValue: item[4],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['tooltip']
                    ) {
                        console.log('test');
                        return apiData.values.map((item) => ({
                            value: [item[1], item[2]], // x and y values
                            symbolSize: item[3], // Individual symbol size
                            label: {
                                show: true,
                                position: 'top',
                                formatter: item[0].toString(), // Use array[0] as the label
                            },
                            tooltipValue: item[4],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['color']
                    ) {
                        console.log('test');
                        return apiData.values.map((item) => ({
                            value: [item[1], item[2]], // x and y values
                            //symbolSize: item[2] // Individual symbol size
                            label: {
                                show: true,
                                position: 'top',
                                formatter: item[0].toString(), // Use array[0] as the label
                            },
                            itemStyle: {
                                color: item[3] ? valueToHSL(item[3]) : '#00000',
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['size']
                    ) {
                        console.log('test');
                        return apiData.values.map((item) => ({
                            value: [item[1], item[2]], // x and y values
                            symbolSize: item[3], // Individual symbol size
                            label: {
                                show: true,
                                position: 'top',
                                formatter: item[0].toString(), // Use array[0] as the label
                            },
                            // itemStyle: {
                            //     color: item[3]
                            // }
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] &&
                        data.option['_state']['fields']['XAxis'] &&
                        data.option['_state']['fields']['YAxis'] &&
                        data.option['_state']['fields']['tooltip']
                    ) {
                        console.log('test');
                        return apiData.values.map((item) => ({
                            value: [item[1], item[2]], // x and y values
                            //symbolSize: item[2] // Individual symbol size
                            label: {
                                show: true,
                                position: 'top',
                                formatter: item[0].toString(), // Use array[0] as the label
                            },
                            itemStyle: {
                                color: item[3],
                            },
                            tooltipValue: item[4],
                        }));
                    }
                }
            }
            return apiData.values.map((item) => ({
                value: [item[1], item[2]], // x and y values
                //symbolSize: item[2]
                label: {
                    show: true,
                    position: 'top',
                    formatter: item[0].toString(), // Use array[0] as the label
                }, // Individual symbol size
            }));
        }
    }

    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    const echartsLoaded = debounce((chart) => {
        chart.on('brushSelected', (params) => {
            console.log('selecteddata', params, params.batch[0].selected);
            let selectedData = params.batch[0].selected[0].dataIndex;
            console.log(selectedData, 'selectedData');
            const currentOption = chart.getOption();
            let labelData = currentOption.series[0].data;
            console.log(labelData, 'labelData');
            console.log(currentOption, 'currentOption');
            const filteredLabels = selectedData.map(
                (index) => labelData[index].label.formatter,
            );
            console.log(filteredLabels, 'filteredLabels');
            if (filteredLabels.length > 0) {
                handleSelection(
                    filteredLabels,
                    currentOption.series[0].label.name,
                );
            }
        });
    }, 2000);

    const handleSelection = debounce((value: any, name: any) => {
        // update the frame
        frame.filter(`SetFrameFilter(${name}==[${value}])`);
    }, 2000);
    const onClickChart = {
        contextmenu: (params) => {
            //  let currentOption = chart.getOption();
            // console.log(currentOption,"currentOption")
            console.log(params, 'params');
            if (params.data) {
                let labelName = data.option['series'][0]['label']['name'];
                console.log(labelName, 'labelName');
                console.log('Right-clicked data:', params.data);
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: params.event.event.clientX,
                              mouseY: params.event.event.clientY,
                              value: {
                                  label: labelName,
                                  value: params.data.label.formatter,
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
                console.log('test');
            }
        },
    };

    if (!data.option) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    }
    if (typeof data.option === 'string') {
        try {
            let processedFrameData = processData(frame.data);
            console.log(processedFrameData, 'processedFrameData');
            if (processedFrameData && processedFrameData.length > 0) {
                data.option['series'][0]['data'] = processedFrameData;
            }
            return (
                <StyledNoDataContainer {...attrs}>
                    <EChartsReact
                        option={data.option}
                        // onChartReady={echartsLoaded}
                        // onEvents={handleChartEvents}
                    />
                </StyledNoDataContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer error {...attrs}>
                    There was an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    } else {
        let processedFrameData = processData(frame.data);
        console.log(processedFrameData, 'processedFrameData');
        if (processedFrameData && processedFrameData.length > 0) {
            data.option['series'][0]['data'] = processedFrameData;
        }
        return (
            <StyledNoDataContainer {...attrs}>
                <EChartsReact
                    option={data.option}
                    onChartReady={(chart) => {
                        echartsLoaded(chart);
                    }}
                    onEvents={onClickChart}
                    // ref={chartRef}
                />
                <VizBlockContextMenu
                    id={id}
                    frame={frame}
                    contextMenu={contextMenu}
                    onClose={() => setContextMenu(null)}
                />
            </StyledNoDataContainer>
        );
    }
});
