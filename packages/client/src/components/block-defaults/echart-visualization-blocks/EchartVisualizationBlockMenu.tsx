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

import { Sync } from '@mui/icons-material';

export const EchartVisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
    console.log(data);
    const SelectVariant = () => {
        switch (data.variation) {
            case 'echart-line-chart':
                return <LineSettings id={id} />;
            default:
                return <></>;
        }
    };

    // get all of the frames
    const getFrames = useBlocksPixel<string[]>('GetFrames();', {
        data: [],
    });

    // options for the autocomplete
    const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];

    // sync block data
    const syncBlockData = () => {
        getFrames.refresh();
    };

    return (
        <Stack padding={2} height="100%">
            {/* Frame selection */}
            <BaseSettingSection label="Frame">
                <Autocomplete
                    fullWidth
                    multiple={false}
                    disabled={getFrames.status !== 'SUCCESS'}
                    value={data.frame.name}
                    options={options}
                    getOptionLabel={(option) => {
                        return option;
                    }}
                    onChange={(_, value) => {
                        // update the frame
                        setData('frame.name', value);
                    }}
                    freeSolo={false}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder="Select frame"
                            size="small"
                            variant="outlined"
                        />
                    )}
                />
                <IconButton size="small" onClick={() => syncBlockData()}>
                    <Sync />
                </IconButton>
            </BaseSettingSection>

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
