import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
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

    const hasNoData = () => {
        if (!data.specJson) {
            return true;
        }
        if ((data.specJson?.$schema ?? '').includes('vega-lite')) {
            return (
                !data.specJson?.data ||
                (data.specJson.hasOwnProperty('data') &&
                    !(data.specJson?.data as { values: Array<any> }).values
                        ?.length)
            );
        } else {
            return (
                !data.specJson.data ||
                (data.specJson.hasOwnProperty('data') &&
                    (Array.isArray(data.specJson.data)
                        ? !data.specJson.data.length
                        : !(data.specJson?.data as { values: Array<any> })
                              .values?.length))
            );
        }
    };

    if (!data.specJson || hasNoData()) {
        return (
            <div style={{ height: '200px', width: '200px' }} {...attrs}>
                Add spec to render your visualization
            </div>
        );
    }

    const Chart = createClassFromSpec({ spec: data.specJson });

    return (
        <StyledChartContainer {...attrs}>
            <Chart actions={false} />
        </StyledChartContainer>
    );
});
