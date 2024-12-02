import { observer } from 'mobx-react-lite';
import {
    Autocomplete,
    TextField,
    useNotification,
    IconButton,
} from '@semoss/ui';
import { Sync } from '@mui/icons-material';
import { useBlockSettings, useBlocksPixel } from '@/hooks';
import { BaseSettingSection } from '@/components/block-settings';
import { VegaVisualizationBlockDef } from './VegaVisualizationBlock';
import { BarSettings } from '@/components/block-settings';
import { BAR_VARIANT } from './VegaVisualization.constants';

interface VegaVisualizationBlockSettingsProps {
    /** Id of the block */
    id: string;
}

export const VegaVisualizationBlockSettings = observer(
    ({ id }: VegaVisualizationBlockSettingsProps) => {
        const notification = useNotification();
        const { data, setData } =
            useBlockSettings<VegaVisualizationBlockDef>(id);

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
                {data.variation === BAR_VARIANT && (
                    <BarSettings id={id} path="specJson" />
                )}
            </>
        );
    },
);
