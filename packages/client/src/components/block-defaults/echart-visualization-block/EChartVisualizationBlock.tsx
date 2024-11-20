import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import EChartContainer from './EChartContainer';

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

export interface EChartVisualizationBlockDef {
    widget: 'e-chart';
    data: {
        option: {};
        variation: undefined | string;
    };
    listeners: {};
    slots: never;
}

export const EchartVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs, listeners } =
        useBlock<EChartVisualizationBlockDef>(id);
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    const echartsEvents = {};
    console.log(data, attrs, listeners);
    if (!data.option) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    } else {
        return (
            <StyledNoDataContainer {...attrs}>
                <EChartContainer
                    id={id}
                    dataOption={data}
                    listenersObj={listeners}
                />
            </StyledNoDataContainer>
        );
    }
    return (
        <StyledNoDataContainer {...attrs}>
            No Data to Render
        </StyledNoDataContainer>
    );
});
