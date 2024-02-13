import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
}));

type BaseVegaSpec = {
    $schema: string;
    title: string | null;
    width: number | null;
    height: number | null;
    padding: number | null;
    data: {
        values: undefined | Array<object>;
    };
    mark: 'bar' | 'arc';
    encoding: {
        x?: {
            field: string;
            title: string;
            type: 'nominal' | 'quantitative';
            axis: { labelAngle: 0 };
        };
        y?: {
            field: string;
            title: string;
            type: 'nominal' | 'quantitative';
        };
        xOffset?: {
            field: string;
        };
        theta?: {
            field: string;
            type: 'quantitative';
            stack: 'normalize';
        };
        color?: {
            field: string;
            title?: string;
            type?: 'nominal';
        };
    };
};

export interface VegaVisualizationBlockDef extends BlockDef<'vega'> {
    widget: 'vega';
    data: {
        specJson: undefined | object | BaseVegaSpec;
    };
    slots: never;
}

export interface VegaBarChartBlockDef extends BlockDef<'bar-chart'> {
    widget: 'bar-chart';
    data: {
        specJson: undefined | BaseVegaSpec;
    };
    slots: never;
}

export interface VegaGroupedBarChartBlockDef
    extends BlockDef<'grouped-bar-chart'> {
    widget: 'grouped-bar-chart';
    data: {
        specJson: undefined | BaseVegaSpec;
    };
    slots: never;
}

export interface VegaPieChartBlockDef extends BlockDef<'pie-chart'> {
    widget: 'pie-chart';
    data: {
        specJson: undefined | BaseVegaSpec;
    };
    slots: never;
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);

    if (
        !data.specJson ||
        (data.specJson.hasOwnProperty('data') &&
            !(data?.specJson as BaseVegaSpec).data.values?.length)
    ) {
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
