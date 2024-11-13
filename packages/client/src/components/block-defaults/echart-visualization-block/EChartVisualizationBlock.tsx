import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import EChartsReact from 'echarts-for-react';
import { on } from 'events';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '20vh',
    width: '80vh',
    color: error ? theme.palette.error.main : 'unset',
}));

export interface EChartVisualizationBlockDef {
    widget: 'e-chart';
    data: {
        option: any;
        variation: undefined | string;
    };
    listeners: never;
    slots: never;
}

export const EchartVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<EChartVisualizationBlockDef>(id);
    console.log(data);
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    const echartsEvents = {};

    function echartsLoaded(echartInstance) {
        console.log('chart loaded', echartInstance);
        echartInstance.dispatchAction({
            type: 'takeGlobalCursor',
            key: 'dataZoomSelect',
            // Activate or inactivate.
            dataZoomSelectActive: true,
        });
        echartInstance.on('click', function () {
            console.log('click detected');
        });
    }
    if (!data.option) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    } else {
        return (
            <StyledNoDataContainer {...attrs}>
                <EChartsReact
                    option={data.option}
                    onChartReady={echartsLoaded}
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
