import { BlockComponent } from '@/stores';
import { Stack, Autocomplete, TextField, IconButton } from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
    BaseSettingSection,
} from '@/components/block-settings';
import { useBlockSettings, useBlocksPixel } from '@/hooks';
import { LineSettings } from './Variants';
import { EchartVisualizationBlockDef } from './EchartVisualizationBlock';

export const EchartVisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);

    const SelectVariant = () => {
        switch (data.variation) {
            case 'echart-line-chart':
                return <LineSettings id={id} />;
            default:
                return <></>;
        }
    };

    return (
        <Stack padding={2} height="100%">
            {/* Variation selection */}
            {SelectVariant()}

            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            <JsonSettings id={id} path="option" />
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
