import { CSSProperties, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { styled } from '@mui/material';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
}));

export interface PieChartBlockDef extends BlockDef<'pie-chart'> {
    widget: 'pie-chart';
    data: {
        chartData: string | Array<any>;
        categoryField: string;
        valueField: string;
        categoryLabel?: string;
        chartTitle?: string;
        width: number;
        height: number;
        padding: number;
    };
    slots: never;
}

export const PieChartBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<PieChartBlockDef>(id);

    const specJsonData = useMemo(() => {
        if (typeof data.chartData === 'string') {
            const cleaned = data.chartData.replace(/ {4}|[\t\n\r]/gm, '');
            try {
                return JSON.parse(cleaned);
            } catch (e) {
                return [];
            }
        } else {
            return data.chartData;
        }
    }, [data.chartData]);

    const specJsonObject = useMemo(() => {
        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            title: data.chartTitle ?? null,
            width: data.width ?? null,
            height: data.height ?? null,
            padding: data.padding ?? null,
            data: {
                values: specJsonData,
            },
            mark: 'arc',
            encoding: {
                theta: {
                    field: data.valueField,
                    type: 'quantitative',
                    stack: 'normalize',
                },
                color: {
                    field: data.categoryField,
                    title: data.categoryLabel ?? data.categoryField,
                    type: 'nominal',
                },
            },
        } as VisualizationSpec;
    }, [data]);

    if (!data.chartData) {
        return (
            <div style={{ height: data.height, width: data.width }} {...attrs}>
                Add data to render your visualization
            </div>
        );
    }

    const PieChart = createClassFromSpec({
        spec: specJsonObject,
    });

    return (
        <StyledChartContainer {...attrs}>
            <PieChart data={specJsonData} actions={false} />
        </StyledChartContainer>
    );
});
