import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import { Bar } from './Variants/bar-chart/Bar';
import { Pie } from './Variants/PieChart/echartblocks';

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    minHeight: '50%',
    minWidth: '50%',
    maxWidth: '80%',
    maxHeight: '80%',
    color: error ? theme.palette.error.main : 'unset',
}));

const StyledDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    minHeight: '50%',
    minWidth: '50%',
}));

export interface VisualizationColumns {
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
            display: string | undefined;
            // flexDirection: string | undefined;
            padding: string | undefined;
            gap: string | undefined;
            // flexWrap: string | undefined;
        };
        option: {};
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: VisualizationColumns[];
        contextMenu: {
            hideUnfilter: boolean;
            hideFilter: boolean;
            hideExclude: boolean;
        };
    };
    listeners: {};
    slots: never;
}

export const VisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);

    if (!data.option) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    }

    return (
        <StyledDataContainer {...attrs} style={{ ...data.style }}>
            {data.variation === 'echart-bar-graph' && <Bar id={id} />}
            {data.variation === 'echart-pie-chart' && <Pie id={id}></Pie>}
        </StyledDataContainer>
    );
});
