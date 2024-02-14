import { BlockConfig } from '@/stores';
import {
    VegaVisualizationBlockDef,
    VegaVisualizationBlock,
} from './VegaVisualizationBlock';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { InputSettings } from '@/components/block-settings';
import { AIGenerationSettings } from '@/components/block-settings/shared/AIGenerationSettings';

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
    isBlocksMenuEnabled: true,
    contentMenu: [
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
                {
                    description: 'AI Generator',
                    render: ({ id }) => (
                        <AIGenerationSettings
                            id={id}
                            path="specJson"
                            appendPrompt={
                                'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
                            }
                            placeholder="Ex: Generate a bar graph."
                            valueAsObject
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
