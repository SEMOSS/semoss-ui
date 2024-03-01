import { BlockComponent } from '@/stores';
import { Stack } from '@semoss/ui';
import {
    AIGenerationSettings,
    JsonSettings,
} from '@/components/block-settings';

export const VegaVisualizationBlockMenu: BlockComponent = ({ id }) => {
    return (
        <Stack padding={2} height="100%">
            <JsonSettings id={id} path="specJson" />
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
    );
};
