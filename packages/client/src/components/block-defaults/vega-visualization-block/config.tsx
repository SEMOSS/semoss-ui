import React from 'react';
import { BlockConfig } from '@/stores';
import {
    VegaVisualizationBlockDef,
    VegaVisualizationBlock,
    VegaBarChartBlockDef,
    VegaGroupedBarChartBlockDef,
    VegaPieChartBlockDef,
} from './VegaVisualizationBlock';
import { Addchart, BarChart, Insights, PieChart } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { InputSettings, QueryInputSettings } from '@/components/block-settings';
import { VisualizationSpec } from 'react-vega';

// method for generating configs for the different vega visualization types
const generateConfig = (
    widget: 'vega' | 'bar-chart' | 'grouped-bar-chart' | 'pie-chart' = 'vega',
    specJson: undefined | VisualizationSpec = undefined,
    icon: React.FunctionComponent = Insights,
    contentMenu: {
        name: string;
        children: {
            /** Description for the setting */
            description: string;
            /** Render the setting */
            render: (props: {
                /** Id of the block */
                id: string;
            }) => JSX.Element;
        }[];
    }[] = [
        {
            name: 'General',
            children: [
                {
                    description: 'JSON Specification',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="JSON"
                            path="specJson"
                            valueAsObject
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: {
        name: string;
        children: {
            /** Description for the setting */
            description: string;
            /** Render the setting */
            render: (props: {
                /** Id of the block */
                id: string;
            }) => JSX.Element;
        }[];
    }[] = [],
) => ({
    widget: widget,
    type: BLOCK_TYPE_CHART,
    data: {
        specJson: specJson,
    },
    listeners: {},
    slots: {},
    render: VegaVisualizationBlock,
    icon: icon,
    isBlocksMenuEnabled: true,
    contentMenu: contentMenu,
    styleMenu: styleMenu,
});

export const VegaVisualizationBlockConfig =
    generateConfig() as BlockConfig<VegaVisualizationBlockDef>;
export const VegaBarChartBlockConfig = generateConfig(
    'bar-chart',
    {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        title: undefined,
        width: 200,
        height: 200,
        padding: 5,
        data: {
            values: undefined,
        },
        mark: 'bar',
        encoding: {
            x: {
                field: undefined,
                title: undefined,
                type: 'nominal',
                axis: { labelAngle: 0 },
            },
            y: {
                field: undefined,
                title: undefined,
                type: 'quantitative',
            },
        },
    },
    BarChart,
    [
        {
            name: 'General',
            children: [
                {
                    description: 'Data',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Data"
                            path="specJson.data.values"
                        />
                    ),
                },
                {
                    description: 'X-Axis Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="X-Axis Field"
                            path="specJson.encoding.x.field"
                        />
                    ),
                },
                {
                    description: 'Y-Axis Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Y-Axis Field"
                            path="specJson.encoding.y.field"
                        />
                    ),
                },
                {
                    description: 'Title',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Title"
                            path="specJson.title"
                        />
                    ),
                },
                {
                    description: 'X-Axis Label',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="X-Axis Label"
                            path="specJson.encoding.x.title"
                        />
                    ),
                },
                {
                    description: 'Y-Axis Label',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Y-Axis Label"
                            path="specJson.encoding.y.title"
                        />
                    ),
                },
            ],
        },
    ],
    [
        {
            name: 'Dimensions',
            children: [
                {
                    description: 'Width',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Width"
                            path="specJson.width"
                            type="number"
                        />
                    ),
                },
                {
                    description: 'Height',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Height"
                            path="specJson.height"
                            type="number"
                        />
                    ),
                },
            ],
        },
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Chart Padding',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Padding"
                            path="specJson.padding"
                            type="number"
                        />
                    ),
                },
            ],
        },
    ],
) as BlockConfig<VegaBarChartBlockDef>;
export const VegaGroupedBarChartBlockConfig = generateConfig(
    'grouped-bar-chart',
    {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        title: undefined,
        width: 200,
        height: 200,
        padding: 5,
        data: {
            values: undefined,
        },
        mark: 'bar',
        encoding: {
            x: {
                field: undefined,
                title: undefined,
                type: 'nominal',
                axis: { labelAngle: 0 },
            },
            y: {
                field: undefined,
                title: undefined,
                type: 'quantitative',
            },
            xOffset: {
                field: undefined,
            },
            color: {
                field: undefined,
            },
        },
    },
    Addchart,
    [
        {
            name: 'General',
            children: [
                {
                    description: 'Data',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Data"
                            path="specJson.data.values"
                        />
                    ),
                },
                {
                    description: 'Category Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Category Field"
                            path="specJson.encoding.x.field"
                        />
                    ),
                },
                {
                    description: 'Group Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Group Field"
                            path="specJson.encoding.xOffset.field"
                            secondaryPath="specJson.encoding.color.field"
                        />
                    ),
                },
                {
                    description: 'Y-Axis Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Y-Axis Field"
                            path="specJson.encoding.y.field"
                        />
                    ),
                },
                {
                    description: 'Title',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Title"
                            path="specJson.title"
                        />
                    ),
                },
                {
                    description: 'X-Axis Label',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="X-Axis Label"
                            path="specJson.encoding.x.title"
                        />
                    ),
                },
                {
                    description: 'Y-Axis Label',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Y-Axis Label"
                            path="specJson.encoding.y.title"
                        />
                    ),
                },
            ],
        },
    ],
    [
        {
            name: 'Dimensions',
            children: [
                {
                    description: 'Width',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Width"
                            path="specJson.width"
                            type="number"
                        />
                    ),
                },
                {
                    description: 'Height',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Height"
                            path="specJson.height"
                            type="number"
                        />
                    ),
                },
            ],
        },
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Chart Padding',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Padding"
                            path="specJson.padding"
                            type="number"
                        />
                    ),
                },
            ],
        },
    ],
) as BlockConfig<VegaGroupedBarChartBlockDef>;
export const VegaPieChartBlockConfig = generateConfig(
    'pie-chart',
    {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        title: undefined,
        width: 200,
        height: 200,
        padding: 5,
        data: {
            values: undefined,
        },
        mark: 'arc',
        encoding: {
            theta: {
                field: undefined,
                type: 'quantitative',
                stack: 'normalize',
            },
            color: {
                field: undefined,
                title: undefined,
                type: 'nominal',
            },
        },
    },
    PieChart,
    [
        {
            name: 'General',
            children: [
                {
                    description: 'Data',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Data"
                            path="specJson.data.values"
                        />
                    ),
                },
                {
                    description: 'Value Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Value Field"
                            path="specJson.encoding.theta.field"
                        />
                    ),
                },
                {
                    description: 'Category Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Category Field"
                            path="specJson.encoding.color.field"
                        />
                    ),
                },
                {
                    description: 'Title',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Title"
                            path="specJson.title"
                        />
                    ),
                },
                {
                    description: 'Category Label',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Category Label"
                            path="specJson.encoding.color.title"
                        />
                    ),
                },
            ],
        },
    ],
    [
        {
            name: 'Dimensions',
            children: [
                {
                    description: 'Width',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Width"
                            path="specJson.width"
                            type="number"
                        />
                    ),
                },
                {
                    description: 'Height',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Height"
                            path="specJson.height"
                            type="number"
                        />
                    ),
                },
            ],
        },
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Chart Padding',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Padding"
                            path="specJson.padding"
                            type="number"
                        />
                    ),
                },
            ],
        },
    ],
) as BlockConfig<VegaPieChartBlockDef>;
