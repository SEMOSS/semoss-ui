import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import { Bar } from './Variants/Bar';
import { ScatterPlotBlock } from './Variants/ScatterPlot';

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '50vh',
    width: '80vh',
    color: error ? theme.palette.error.main : 'unset',
}));

export interface EChartColumns {
    name: string;
    selector: string;
    width: string;
}

export interface EchartVisualizationBlockDef {
    widget: 'e-chart';
    data: {
        style: {
            height: number;
            width: number;
        };
        option: {};
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: EChartColumns[];
        contextMenu: {
            hideUnfilter: boolean;
            hideFilter: boolean;
            hideExclude: boolean;
        };
    };
    listeners: {};
    slots: never;
}

export const EchartVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);

    if (!data.option) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    }
    if (typeof data.option === 'string') {
        try {
            return (
                <StyledNoDataContainer {...attrs}>
                    {data.variation === 'echart-bar-graph' && <Bar id={id} />}
                    {data.variation === 'echart-scatter-plots' && (
                        <ScatterPlotBlock id={id} />
                    )}
                </StyledNoDataContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer error {...attrs}>
                    There was an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    } else {
        return (
            <StyledNoDataContainer {...attrs} style={{ ...data.style }}>
                {data.variation === 'echart-bar-graph' && <Bar id={id} />}
                {data.variation === 'echart-scatter-plots' && (
                    <ScatterPlotBlock id={id} />
                )}
            </StyledNoDataContainer>
        );
    }
});
