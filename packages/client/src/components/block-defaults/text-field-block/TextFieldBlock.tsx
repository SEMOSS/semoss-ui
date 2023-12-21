import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { LinearProgress, TextField } from '@mui/material';

export interface TextFieldBlockDef extends BlockDef<'text-field'> {
    widget: 'text-field';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        type: string;
        required: boolean;
        disabled: boolean;
        hint?: string;
        loading?: boolean;
    };
}

export const TextFieldBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<TextFieldBlockDef>(id);

    return (
        <TextField
            size="small"
            value={data.value}
            label={data.label}
            required={data.required}
            disabled={data?.disabled || data?.loading}
            helperText={
                data?.loading ? <LinearProgress color="primary" /> : data?.hint
            }
            style={{
                ...data.style,
            }}
            InputLabelProps={{
                shrink: true,
            }}
            type={data.type}
            onChange={(e) => {
                const value = e.target.value;

                // update the value
                setData('value', value);
            }}
            {...attrs}
        />
    );
});
