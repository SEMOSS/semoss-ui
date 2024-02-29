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
import { Stack } from '@semoss/ui';

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
    menu: ({ id }) => (
        <Stack padding={2}>
            <JsonModalSettings id={id} label="JSON" path="specJson" />
            <AIGenerationSettings
                id={id}
                path="specJson"
                appendPrompt={
                    'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
                }
                placeholder="Ex: Generate a bar graph."
                valueAsObject
            />
        </Stack>
    ),
};
