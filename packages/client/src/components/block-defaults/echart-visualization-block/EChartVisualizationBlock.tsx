import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks, useBlockSettings } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import EChartContainer from './EChartContainer';
import { MutableRefObject, useRef, useState } from 'react';
import { PathValue } from '@/types';

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

export interface EChartVisualizationBlockDef {
    widget: 'e-chart';
    data: {
        option: {};
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: EChartColumns[];
    };
    listeners: {};
    slots: never;
}
interface FrameData {
    frameName: string;
    frameFiltered: boolean;
}

export const EchartVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs, listeners } =
        useBlock<EChartVisualizationBlockDef>(id);
    const { setData } = useBlockSettings<EChartVisualizationBlockDef>(id);
    const currentFrameData: MutableRefObject<FrameData> = useRef<FrameData>({
        frameName: '',
        frameFiltered: false,
    });
    echarts.use([BarChart, CanvasRenderer, TooltipComponent]);
    const echartsEvents = {};
    console.log(data, attrs, listeners);

    function latestChartData(frameName, chartData) {
        setTimeout(() => {
            setData('option', chartData as PathValue<any, any>);
        }, 300);
        console.log(chartData, 'chartData');
        currentFrameData.current.frameName = frameName;
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
                <EChartContainer
                    id={id}
                    dataOption={data}
                    listenersObj={listeners}
                    currentFrame={currentFrameData.current.frameName}
                    updateChartData={latestChartData}
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
