import { BlockComponent } from '@/stores';
import { Stack, styled } from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
} from '@/components/block-settings';
import { useBlock } from '@/hooks';
import E_PieChart from './pie-chart-feature';

export const EchartVisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);

    return (
        <Stack padding={2} height="100%">
            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            <JsonSettings id={id} path="option" />
            {!data.variation && (
                <AIGenerationSettings
                    id={id}
                    path="option"
                    appendPrompt={
                        'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
                    }
                    placeholder="Ex: Generate a bar graph."
                    valueAsObject
                />
            )}
            {/* {data.variation === 'echart-pie-chart' &&( */}
            <E_PieChart showTool={true} id={id}></E_PieChart>
        </Stack>
    );
};
