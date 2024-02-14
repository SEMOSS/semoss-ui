import { BlockConfig } from '@/stores';
import { DefaultBlockDefinitions } from '../block-defaults';
import { config as ButtonBlockConfig } from '../block-defaults/button-block';
import { config as CheckboxBlockConfig } from '../block-defaults/checkbox-block';
import { config as ContainerBlockConfig } from '../block-defaults/container-block';
import { config as ImageBlockConfig } from '../block-defaults/image-block';
import { config as InputBlockConfig } from '../block-defaults/input-block';
import { config as LinkBlockConfig } from '../block-defaults/link-block';
import { config as MarkdownBlockConfig } from '../block-defaults/markdown-block';
import { config as PageBlockConfig } from '../block-defaults/page-block';
import { config as ProgressBlockConfig } from '../block-defaults/progress-block';
import { config as QueryBlockConfig } from '../block-defaults/query-block';
import { config as SelectBlockConfig } from '../block-defaults/select-block';
import { config as TextBlockConfig } from '../block-defaults/text-block';
import { config as ToggleButtonBlockConfig } from '../block-defaults/toggle-button-block';
import { config as UploadBlockConfig } from '../block-defaults/upload-block';
import { config as VegaVisualizationBlockConfig } from '../block-defaults/vega-visualization-block';
import { Addchart, BarChart, PieChart } from '@mui/icons-material';
import { InputSettings, QueryInputSettings } from '../block-settings';

export interface MenuBlockConfig extends BlockConfig<DefaultBlockDefinitions> {
    display: string;
}

/**
 * Blocks that appear on the menu
 * Can be different implementations of the same block with different configs
 */
export const MenuBlocks: MenuBlockConfig[] = [
    {
        display: 'Bar Chart',
        ...VegaVisualizationBlockConfig,
        data: {
            ...VegaVisualizationBlockConfig.data,
            variation: 'Bar Chart',
            specJson: {
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
        },
        icon: BarChart,
        contentMenu: [
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
        styleMenu: [
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
    },
    {
        display: 'Button',
        ...ButtonBlockConfig,
    },
    {
        display: 'Checkbox',
        ...CheckboxBlockConfig,
    },
    {
        display: 'Container',
        ...ContainerBlockConfig,
    },
    {
        display: 'Grouped Bar Chart',
        ...VegaVisualizationBlockConfig,
        data: {
            ...VegaVisualizationBlockConfig.data,
            variation: 'Grouped Bar Chart',
            specJson: {
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
        },
        icon: Addchart,
        contentMenu: [
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
        styleMenu: [
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
    },
    {
        display: 'Image',
        ...ImageBlockConfig,
    },
    {
        display: 'Input',
        ...InputBlockConfig,
    },
    {
        display: 'Link',
        ...LinkBlockConfig,
    },
    {
        display: 'Markdown',
        ...MarkdownBlockConfig,
    },
    {
        display: 'Page',
        ...PageBlockConfig,
    },
    {
        display: 'Pie Chart',
        ...VegaVisualizationBlockConfig,
        data: {
            ...VegaVisualizationBlockConfig.data,
            variation: 'Pie Chart',
            specJson: {
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
        },
        icon: PieChart,
        contentMenu: [
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
        styleMenu: [
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
    },
    {
        display: 'Progress',
        ...ProgressBlockConfig,
    },
    {
        display: 'Query',
        ...QueryBlockConfig,
    },
    {
        display: 'Select',
        ...SelectBlockConfig,
    },
    {
        display: 'Text',
        ...TextBlockConfig,
    },
    {
        display: 'Toggle Button',
        ...ToggleButtonBlockConfig,
    },
    {
        display: 'Upload',
        ...UploadBlockConfig,
    },
    {
        display: 'Vega',
        ...VegaVisualizationBlockConfig,
    },
];
