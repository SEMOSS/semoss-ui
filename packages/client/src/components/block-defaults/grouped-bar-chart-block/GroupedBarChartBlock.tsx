import { CSSProperties, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { styled } from '@mui/material';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { VisualizationSpec, createClassFromSpec } from 'react-vega';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
}));

// todo: should we explicitly just limit to three groups, or allow an infinite amount?
// more than three and group bar chart seems like a bad chart choice
export interface GroupedBarChartBlockDef extends BlockDef<'grouped-bar-chart'> {
    widget: 'grouped-bar-chart';
    data: {
        chartData: string | Array<any>;
        categoryField: string;
        groupField: string;
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

export const GroupedBarChartBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<GroupedBarChartBlockDef>(id);

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
                    field: data.categoryField,
                    title: data.xAxisLabel ?? data.categoryField,
                    type: 'nominal',
                    axis: { labelAngle: 0 },
                },
                y: {
                    field: data.yAxisField,
                    title: data.yAxisLabel,
                    type: 'quantitative',
                },
                xOffset: {
                    field: data.groupField,
                },
                color: {
                    field: data.groupField,
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

    const GroupedBarChart = createClassFromSpec({
        mode: 'vega-lite',
        spec: specJsonObject,
    });

    return (
        <StyledChartContainer {...attrs}>
            <GroupedBarChart data={specJsonData} actions={false} />
        </StyledChartContainer>
    );
});
