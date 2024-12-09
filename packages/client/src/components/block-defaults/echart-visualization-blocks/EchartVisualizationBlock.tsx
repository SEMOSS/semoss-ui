import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import { Bar } from './Variants/Bar';
import { LineBlock } from './Variants';

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

export interface EchartVisualizationBlockDef {
    widget: 'e-chart';
    data: {
        option: {} | string;
        frame: {
            name: string;
        };
        variation: undefined | string;
        columns: EChartColumns[];
        contextMenu: {
            hideUnfilter: boolean;
            hideFilter: boolean;
        };
    };
    listeners: {};
    slots: never;
}

export const EchartVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);

    const SelectVariant = () => {
        switch (data.variation) {
            case 'echart-bar-graph':
                return <Bar id={id} />;
            case 'echart-line-chart':
                return <LineBlock id={id} />;
            default:
                return <></>;
        }
    };

    if (!data.option) {
        return (
            <StyledNoDataContainer {...attrs}>
                Add JSON to render your visualization
            </StyledNoDataContainer>
        );
    }

    return <>{SelectVariant()}</>;
});
