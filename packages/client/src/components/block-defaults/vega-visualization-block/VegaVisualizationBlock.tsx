import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '200px',
    width: '200px',
    color: error ? theme.palette.error.main : 'unset',
}));

export interface BaseVisualizationBlockDef {
    data: {
        specJson: undefined | VisualizationSpec;
    };
    slots: never;
}

export interface VegaVisualizationBlockDef
    extends Omit<BlockDef<'vega'>, 'data' | 'slots'>,
        BaseVisualizationBlockDef {
    widget: 'vega';
}

export interface VegaBarChartBlockDef
    extends Omit<BlockDef<'bar-chart'>, 'data' | 'slots'>,
        BaseVisualizationBlockDef {
    widget: 'bar-chart';
}

export interface VegaGroupedBarChartBlockDef
    extends Omit<BlockDef<'grouped-bar-chart'>, 'data' | 'slots'>,
        BaseVisualizationBlockDef {
    widget: 'grouped-bar-chart';
}

export interface VegaPieChartBlockDef
    extends Omit<BlockDef<'pie-chart'>, 'data' | 'slots'>,
        BaseVisualizationBlockDef {
    widget: 'pie-chart';
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);

    if (!data.specJson) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add spec to render your visualization
            </StyledNoDataContainer>
        );
    } else if (typeof data.specJson === 'string') {
        // spec was unable to be parsed as object
        return (
            <StyledNoDataContainer error {...attrs}>
                There was an issue parsing your JSON.
            </StyledNoDataContainer>
        );
    }

    const Chart = createClassFromSpec({ spec: data.specJson });

    return (
        <StyledChartContainer {...attrs}>
            <Chart actions={false} />
        </StyledChartContainer>
    );
});
