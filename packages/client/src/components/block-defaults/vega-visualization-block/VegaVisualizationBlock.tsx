import { CSSProperties, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
}));

export interface VegaVisualizationBlockDef extends BlockDef<'vega'> {
    widget: 'vega';
    data: {
        specJson: string | object;
        data: string | object | Array<any>;
    };
    slots: never;
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);

    const specJsonObject = useMemo(() => {
        if (typeof data.specJson === 'string') {
            const cleaned = data.specJson.replace(/ {4}|[\t\n\r]/gm, '');
            try {
                console.log(JSON.parse(cleaned));
                return JSON.parse(cleaned);
            } catch (e) {
                return {};
            }
        } else {
            console.log(data.specJson);
            return data.specJson;
        }
    }, [data.specJson]);

    const specJsonData = useMemo(() => {
        if (typeof data.data === 'string') {
            const cleaned = data.data.replace(/ {4}|[\t\n\r]/gm, '');
            try {
                return JSON.parse(cleaned);
            } catch (e) {
                return {};
            }
        } else {
            return data.data;
        }
    }, [data.data]);

    if (!data.specJson) {
        return <div {...attrs}>Add spec to render your visualization</div>;
    }

    const Chart = createClassFromSpec({ spec: specJsonObject });

    return (
        <StyledChartContainer {...attrs}>
            <Chart data={specJsonData} />
        </StyledChartContainer>
    );
});
