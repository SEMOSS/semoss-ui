import { BlockComponent } from '@/stores';
import { Stack, styled } from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
} from '@/components/block-settings';
import { useBlock } from '@/hooks';
import VisualizationTool from './Variants/bar-chart/VisualizationTool';
import { VisualizationBlockDef } from './VisualizationBlock';

const StyledContainer = styled('div')(() => ({
    maxHeight: '50vh',
}));
import E_PieChart from './Variants/PieChart/pie-chart-feature';

export const VisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock<VisualizationBlockDef>(id);
    return (
        <Stack>
            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            <StyledContainer>
                <JsonSettings id={id} path="option" height="50vh" />
                {data.variation === 'echart-bar-graph' && (
                    <VisualizationTool showTool={true} id={id} />
                )}
                {data.variation === 'echart-pie-chart' && (
                    <E_PieChart id={id}></E_PieChart>
                )}
            </StyledContainer>

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
