import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';
import { BAR_VARIANT } from './VegaVisualization.constants';
import { Bar } from './Variants/Bar';

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
        frame: {
            name: string;
        };

        specJson: VisualizationSpec | string;
        variation?: undefined | string;
        /** Context Menu */
        contextMenu?: {
            /** Show the unfilter related options */
            hideUnfilter: boolean;

            /** Show the filter related options */
            hideFilter: boolean;
        };
    };
    listeners: {
        onBrush: true;
    };
    slots: never;
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);

    if (!data.specJson || !data.frame.name) {
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
                    <Chart actions={false} />
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
        return <>{data.variation === BAR_VARIANT && <Bar id={id} />}</>;
    }
});
