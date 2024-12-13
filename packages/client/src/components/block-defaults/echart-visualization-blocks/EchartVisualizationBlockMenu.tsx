import { BlockComponent } from '@/stores';
import { Stack } from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
} from '@/components/block-settings';
import { useBlock } from '@/hooks';
import E_PieChart from './Variants/PieChart/pie-chart-feature';

export const EchartVisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    return (
        <Stack>
            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            <JsonSettings id={id} path="option" />
            <E_PieChart id={id}></E_PieChart>
            {/* <CodeEditorSettings id={id} path="specJson" /> */}
            {!data.variation && (
                <AIGenerationSettings
                    id={id}
                    path="option"
                    appendPrompt={'An EChart graph'}
                    placeholder="Ex: Generate a E-Chart bar graph."
                    valueAsObject
                />
            )}
        </Stack>
    );
};
