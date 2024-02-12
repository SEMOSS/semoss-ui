import { CSSProperties, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { styled } from '@mui/material';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
}));

export interface BarChartBlockDef extends BlockDef<'bar-chart'> {
    widget: 'bar-chart';
    data: {
        chartData: string | Array<any>;
        xAxisField: string;
        yAxisField: string;
        xAxisLabel?: string;
        yAxisLabel?: string;
        chartTitle?: string;
        width: number;
        height: number;
        padding: number;
    };
    slots: never;
}

export const BarChartBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<BarChartBlockDef>(id);

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
            mark: 'bar',
            encoding: {
                x: {
                    field: data.xAxisField,
                    title: data.xAxisLabel ?? data.xAxisField,
                    type: 'nominal',
                    axis: { labelAngle: 0 },
                },
                y: {
                    field: data.yAxisField,
                    title: data.yAxisLabel ?? data.yAxisField,
                    type: 'quantitative',
                },
            },
        } as VisualizationSpec;
    }, [data]);

    if (!data.chartData) {
        return (
            <div style={{ height: data.height, width: data.width }} {...attrs}>
                Add spec to render your visualization
            </div>
        );
    }

    const BarChart = createClassFromSpec({ spec: specJsonObject });

    return (
        <StyledChartContainer {...attrs}>
            <BarChart data={specJsonData} actions={false} />
        </StyledChartContainer>
    );
});
