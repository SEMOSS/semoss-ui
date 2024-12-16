import { observer } from 'mobx-react-lite';
import { Autocomplete, TextField, IconButton } from '@semoss/ui';
import { BaseSettingSection, Fields } from '@/components/block-settings';
import { EchartVisualizationBlockDef } from '@/components/block-defaults/echart-visualization-blocks';
import { useBlockSettings, useBlocksPixel } from '@/hooks';
import { Sync } from '@mui/icons-material';

interface LineSettingsProps {
    /** Id of the block */
    id: string;
}

export const LineSettings = observer(({ id }: LineSettingsProps) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
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
        <>
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

            {/* Fields section */}
            <Fields id={id} path={'option'} />
        </>
    );
});
