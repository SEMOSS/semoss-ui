import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { Autocomplete, LinearProgress, TextField } from '@mui/material';

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        options: string[];
        required: boolean;
        disabled: boolean;
        hint?: string;
        loading?: boolean;
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
            options={data?.options ?? []}
            value={data.value}
            disabled={data?.disabled || data?.loading}
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
                    required={data.required}
                    disabled={data?.disabled || data?.loading}
                    helperText={
                        data?.loading ? (
                            <LinearProgress color="primary" />
                        ) : (
                            data?.hint
                        )
                    }
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            )}
            {...attrs}
        />
    );
});
