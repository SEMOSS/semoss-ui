import { observer } from 'mobx-react-lite';
import { Container, Autocomplete, TextField, styled } from '@semoss/ui';
import { BaseSettingSection } from '@/components/block-settings';
import { VegaVisualizationBlockDef } from '@/components/block-defaults/vega-visualization-block';
import { useBlockSettings, useFrameHeaders } from '@/hooks';
import { BlockDef } from '@/stores';

const NoPaddingContainer = styled(Container)(({ theme }) => ({
    padding: '0px!important',
}));
const RowContainer = styled(Container)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    gap: theme.spacing(2),
}));

interface FieldsSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
}

export const Fields = observer(
    <D extends BlockDef = BlockDef>({ id }: FieldsSettingsProps<D>) => {
        const { data, setData } =
            useBlockSettings<VegaVisualizationBlockDef>(id);

        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data.frame.name);
        const fields = frameHeaders.data.list.map((field) => field.alias) || [];
        return (
            <>
                <BaseSettingSection label="x-Axis">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={data.frame.name === ''}
                        value={data.axis.x}
                        options={fields}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // update the x value
                            setData('axis.x', value);
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
                </BaseSettingSection>
                <BaseSettingSection label="y-Axis">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={data.frame.name === ''}
                        value={data.axis.y}
                        options={fields}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // update the y value
                            setData('axis.y', value);
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
                </BaseSettingSection>
            </>
        );
    },
);
