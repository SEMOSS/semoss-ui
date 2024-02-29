import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';

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

export interface VegaVisualizationBlockDef {
    widget: 'vega';
    data: {
        specJson: undefined | VisualizationSpec | string;
        variation?: undefined | string;
    };
    listeners: never;
    slots: never;
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);

    if (!data.specJson) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add spec to render your visualization
            </StyledNoDataContainer>
        );
    }
    try {
        let Chart;
        // Will get switched out soon, pushed specifically my use case and switching the way things get flattened
        // Handling as string in order to map data tabs values to the JSON
        if (typeof data.specJson === 'string') {
            Chart = createClassFromSpec({ spec: JSON.parse(data.specJson) });
        } else {
            Chart = createClassFromSpec({ spec: data.specJson });
        }

        return (
            <StyledChartContainer {...attrs}>
                <Chart actions={false} />
            </StyledChartContainer>
        );
    } catch (e) {
        // spec was unable to be parsed as object
        return (
            <StyledNoDataContainer error {...attrs}>
                There was an issue parsing your JSON.
            </StyledNoDataContainer>
        );
    }
});
