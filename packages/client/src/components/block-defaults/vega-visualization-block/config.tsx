import { BlockConfig } from '@/stores';
import {
    VegaVisualizationBlockDef,
    VegaVisualizationBlock,
} from './VegaVisualizationBlock';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import {
    InputSettings,
    AIGenerationSettings,
    ConditionalVariationSettings,
    QueryInputSettings,
    JsonModalSettings,
} from '@/components/block-settings';

export const config: BlockConfig<VegaVisualizationBlockDef> = {
    widget: 'vega',
    type: BLOCK_TYPE_CHART,
    data: {
        specJson: undefined,
        variation: undefined,
    },
    listeners: {},
    slots: {},
    render: VegaVisualizationBlock,
    icon: Insights,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'JSON Specification',
                    render: ({ id }) => (
                        <ConditionalVariationSettings id={id}>
                            <JsonModalSettings
                                id={id}
                                label="JSON"
                                path="specJson"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'AI Generator',
                    render: ({ id }) => (
                        <ConditionalVariationSettings id={id}>
                            <AIGenerationSettings
                                id={id}
                                path="specJson"
                                appendPrompt={
                                    'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
                                }
                                placeholder="Ex: Generate a bar graph."
                                valueAsObject
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Data',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={[
                                'bar-chart',
                                'grouped-bar-chart',
                                'pie-chart',
                            ]}
                        >
                            <QueryInputSettings
                                id={id}
                                label="Data"
                                path="specJson.data.values"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'X-Axis Field',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['bar-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="X-Axis Field"
                                path="specJson.encoding.x.field"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Category Field',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['grouped-bar-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="Category Field"
                                path="specJson.encoding.x.field"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Group Field',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['grouped-bar-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="Group Field"
                                path="specJson.encoding.xOffset.field"
                                secondaryPath="specJson.encoding.color.field"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Y-Axis Field',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['bar-chart', 'grouped-bar-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="Y-Axis Field"
                                path="specJson.encoding.y.field"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Value Field',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['pie-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="Value Field"
                                path="specJson.encoding.theta.field"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Category Field',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['pie-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="Category Field"
                                path="specJson.encoding.color.field"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Title',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={[
                                'bar-chart',
                                'grouped-bar-chart',
                                'pie-chart',
                            ]}
                        >
                            <InputSettings
                                id={id}
                                label="Y-Axis Field"
                                path="specJson.encoding.y.field"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'X-Axis Label',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['bar-chart', 'grouped-bar-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="X-Axis Label"
                                path="specJson.encoding.x.title"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Y-Axis Label',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['bar-chart', 'grouped-bar-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="Y-Axis Label"
                                path="specJson.encoding.y.title"
                            />
                        </ConditionalVariationSettings>
                    ),
                },
                {
                    description: 'Category Label',
                    render: ({ id }) => (
                        <ConditionalVariationSettings
                            id={id}
                            variations={['pie-chart']}
                        >
                            <InputSettings
                                id={id}
                                label="Category Label"
                                path="specJson.encoding.color.title"
                            />
                        </ConditionalVariationSettings>
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
};
