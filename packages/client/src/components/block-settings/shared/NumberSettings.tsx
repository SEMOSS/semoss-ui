// NumberSettings.tsx
import { observer } from 'mobx-react-lite';
import { TextField } from '@mui/material';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';

interface NumberSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label to pass into the input
     */
    label: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     * Minimum value allowed
     */
    min?: number;

    /**
     * Maximum value allowed
     */
    max?: number;

    /**
     * Step value for the number input
     */
    step?: number;

    /**
     * Helper text to display below the input
     */
    helperText?: string;
}

export const NumberSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label,
        path,
        min,
        max,
        step = 1,
        helperText,
    }: NumberSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        const handleChange = (value: string) => {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                // Check bounds if min/max are provided
                if (
                    (typeof min === 'undefined' || numValue >= min) &&
                    (typeof max === 'undefined' || numValue <= max)
                ) {
                    setData(
                        path,
                        numValue as PathValue<D['data'], typeof path>,
                    );
                }
            }
        };

        return (
            <BaseSettingSection label={label}>
                <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={data[path] || ''}
                    inputProps={{ min, max, step }}
                    onChange={(e) => handleChange(e.target.value)}
                    helperText={helperText}
                    variant="outlined"
                />
            </BaseSettingSection>
        );
    },
);
