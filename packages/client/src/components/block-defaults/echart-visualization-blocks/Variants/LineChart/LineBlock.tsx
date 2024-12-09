import { observer } from 'mobx-react-lite';
import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts/core';
import { GridComponent, GridComponentOption } from 'echarts/components';
import { LineChart, LineSeriesOption } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import EChartsReact from 'echarts-for-react';
import { EchartVisualizationBlockDef } from '../../EchartVisualizationBlock';

const StyledChartContainer = styled('div')(() => ({
    // width: 'fit-content',
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

export const LineBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);

    echarts.use([
        GridComponent,
        LineChart,
        CanvasRenderer,
        UniversalTransition,
    ]);

    if (typeof data.option === 'string') {
        // if it's a string, it's either invalid json or a query output that needs to be parsed
        // try to parse, and show error otherwise
        try {
            const lineOptions = JSON.parse(data.option);
            return (
                <StyledChartContainer {...attrs}>
                    <EChartsReact option={lineOptions} />
                </StyledChartContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer error {...attrs}>
                    There was an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    }
    return (
        <StyledChartContainer {...attrs}>
            <EChartsReact option={data.option} />
        </StyledChartContainer>
    );
});
