import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';

import EChartsReact from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import { styled } from '@mui/material';
import { createClassFromSpec } from 'react-vega';

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
        specJson: undefined | string;
        variation?: undefined | string;
        option: undefined | string;
    };
    listeners: never;
    slots: never;
}

export const EchartVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);

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

            const Chart = createClassFromSpec({ spec: specJson });

            return (
                <StyledChartContainer {...attrs}>
                    {/* <Chart actions={false} /> */}
                    <EChartsReact option={data.option} echarts={echarts}>
                        {' '}
                    </EChartsReact>
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
                <EChartsReact option={option}> </EChartsReact>
            </StyledChartContainer>
        );
    }
});
