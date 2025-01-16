import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useBlock, useBlockSettings } from '@/hooks';
import { BlockComponent } from '@/stores';

import EChartsReact from 'echarts-for-react';
import ReactEChart from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import { styled } from '@mui/material';
import { createClassFromSpec } from 'react-vega';
import { Paths, PathValue } from '@/types';
import { CustomContextMenu } from './CustomContextMenu';
import { useBlocksPixel, useFrame, useFrameHeaders } from '@/hooks';

export type EchartBlockColumn = {
    /** Name of the column */
    name: string;

    /** Selector for the column */
    selector: string;

    /** Width of the column */
    width: string;
};

export type EchartFrameData = {
    name: string;
    value: string | number;
};

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '500px',
    minHeight: '500px',
}));

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '200px',
    width: '200px',
    color: error ? theme.palette.error.main : 'unset',
}));

var option;
option = {
    title: {
        text: 'World Population',
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow',
        },
    },
    legend: {},
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
    },
    yAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
    },
    xAxis: {
        type: 'category',
        data: ['Brazil', 'Indonesia', 'USA', 'India', 'China', 'World'],
    },
    dataZoom: [
        {
            show: true,
            start: 0,
            end: 100,
        },
        {
            type: 'inside',
            start: 94,
            end: 100,
        },
        {
            show: true,
            yAxisIndex: 0,
            filterMode: 'empty',
            width: 30,
            height: '80%',
            showDataShadow: false,
            left: '96%',
        },
    ],
    series: [
        {
            name: '2011',
            type: 'bar',
            data: [18203, 23489, 29034, 104970, 131744, 630230],
        },
        {
            name: '2012',
            type: 'bar',
            data: [19325, 23438, 31000, 121594, 134141, 681807],
        },
    ],
};

export interface EchartVisualizationBlockDef {
    widget: 'echart';
    data: {
        frame: {
            name: string;
            values: [];
            labels: [];
            labelIndex: number;
            valueIndex: number;
        };
        specJson: undefined | string;
        variation?: undefined | string;
        option: undefined | string;
        columns: EchartBlockColumn[];
    };
    listeners: never;
    slots: never;
}

export const Pie: BlockComponent = observer(({ id }) => {
    const { attrs } = useBlock<EchartVisualizationBlockDef>(id);
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: any;
    } | null>(null);
    const frame = useFrame(data?.frame?.name, {
        selector: 'QueryAll()',
        offset: 0,
        limit: 10,
        enableCount: true,
    });

    const handleClick = (params) => {
        console.log('Data', data);
        console.log('Params', params);
        let option = data.option;
        let selectedIndex = params.dataIndex;
        let chartData = option['series'][0].data;
        console.log('ChartData', chartData);
        chartData = chartData.map((item, index) => ({
            ...item,
            itemStyle: {
                borderColor: selectedIndex === index ? '#000000' : '#fff',
                borderWidth: selectedIndex === index ? 2 : 1,
            },
        }));
        console.log('Revised Chart Data', chartData);
        data.option['series'][0].data = chartData;
        console.log('Final Data', data);
        setData('option', data.option as PathValue<any, any>);
    };

    const onClickChart = {
        contextmenu: (params) => {
            if (params.componentType === 'series') {
                let mouseX = params.event.event.clientX;
                setContextMenu({
                    mouseX: params.event.event.clientX,
                    mouseY: params.event.event.clientY,
                    value: { label: 'SCHOOL', value: params.data.name },
                });

                params.event.event.preventDefault();
            }
        },
        click: (params) => {
            let option = data.option;
            let selectedIndex = params.dataIndex;
            let chartData = option['series'][0].data;
            chartData = chartData.map((item, index) => ({
                ...item,
                itemStyle: {
                    borderColor: selectedIndex === index ? '#000000' : '#fff',
                    borderWidth: selectedIndex === index ? 2 : 1,
                },
            }));
            data.option['series'][0].data = chartData;
            setData('option', data.option as PathValue<any, any>);
        },
    };
    if (!data.specJson) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    }
    if (typeof data.specJson === 'string') {
        // if it's a string, it's either invalid json or a query output that needs to be parsed
        // try to parse, and show error otherwise
        try {
            const specJson = JSON.parse(data.specJson);
            if (frame.count != -1) {
            }
            const Chart = createClassFromSpec({ spec: specJson });
            setData('option', data.option as PathValue<any, any>);
            return (
                <StyledChartContainer {...attrs} id={id}>
                    <ReactEChart
                        //ref={chartRef}
                        option={data.option}
                        onEvents={onClickChart}
                        //onEvents={handleClick1}
                    ></ReactEChart>
                    <CustomContextMenu
                        id={id}
                        frame={frame}
                        contextMenu={contextMenu}
                        onClose={() => setContextMenu(null)}
                    ></CustomContextMenu>
                </StyledChartContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer error {...attrs}>
                    There was an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    } else {
        const Chart = createClassFromSpec({ spec: data.specJson });

        return (
            <StyledChartContainer {...attrs}>
                {/* <Chart actions={false} /> */}
                <EChartsReact option={option} />
                <CustomContextMenu
                    id={id}
                    frame={frame}
                    contextMenu={contextMenu}
                    onClose={() => setContextMenu(null)}
                ></CustomContextMenu>
            </StyledChartContainer>
        );
    }
});
