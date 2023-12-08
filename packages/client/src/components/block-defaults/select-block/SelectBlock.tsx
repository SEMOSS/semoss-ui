import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { Autocomplete } from '@mui/material';
import { TextField } from '@semoss/ui';

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        options: string[];
    };
}

/**
 * Calling this a "select" block because it's better semantically to explain what the block does
 * But using an autocomplete because it offers better UX when there are many options
 */
export const SelectBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<SelectBlockDef>(id);

    return (
        <Autocomplete
            disableClearable
            options={data.options}
            value={data.value}
            sx={{
                ...data.style,
            }}
            onChange={(_, value) => {
                setData('value', value);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    size="small"
                    label={data.label}
                    variant="outlined"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            )}
            {...attrs}
        />
    );
});
