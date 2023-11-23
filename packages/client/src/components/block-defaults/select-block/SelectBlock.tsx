import { useEffect, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, usePixel } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { Autocomplete } from '@mui/material';
import { TextField } from '@semoss/ui';

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        type: string[];
        label: string[];
        options: { label: string; value: string }[];
        value: string;
    };
}

/**
 * Calling this a "select" block because it's better semantically to explain what the block does
 * But using an autocomplete because it offers better UX when there are many options
 */
export const SelectBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<SelectBlockDef>(id);

    const { data: enginesData, status: enginesStatus } = usePixel<string[]>(
        `MyEngines( engineTypes=["MODEL", "VECTOR"]);`,
    );
    useEffect(() => {
        if (enginesStatus === 'SUCCESS' && Array.isArray(enginesData)) {
            //* checking to verify enginesData is an array of engine names
            const newOptions = enginesData.map((engine) => {
                return {
                    label: engine,
                    value: engine,
                };
            });
            setData('options', newOptions);

            // Log the first model and vector if available
            if (newOptions.length > 0) {
                console.log('First Model:', newOptions[0].label);
                if (newOptions.length > 1) {
                    console.log('First Vector:', newOptions[1].label);
                }
            }
        }
    }, [enginesData, enginesStatus, setData]);

    const selectedOption =
        data.options.find((option) => option.value === data.value) || null;

    return (
        <Autocomplete
            disableClearable
            options={data.options || []}
            value={selectedOption}
            isOptionEqualToValue={(option, value) =>
                option.value === value.value
            }
            onChange={(_, newValue) =>
                setData('value', newValue ? newValue.value : '')
            }
            renderInput={(params) => (
                <TextField {...params} label={data.label} variant="outlined" />
            )}
            {...attrs}
        />
    );
});
