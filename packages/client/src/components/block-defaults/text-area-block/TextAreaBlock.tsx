import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { LinearProgress, TextField } from '@mui/material';

export interface TextAreaBlockDef extends BlockDef<'text-area'> {
    widget: 'text-area';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        type: string;
        rows: number;
        multiline: boolean;
        required: boolean;
        disabled: boolean;
        hint?: string;
        loading?: boolean;
    };
}

export const TextAreaBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<TextAreaBlockDef>(id);

    return (
        <TextField
            rows={data.rows}
            multiline={data.multiline}
            value={data.value}
            label={data.label}
            required={data.required}
            disabled={data?.disabled || data?.loading}
            helperText={
                data?.loading ? <LinearProgress color="primary" /> : data?.hint
            }
            sx={{
                ...data.style,
            }}
            onChange={(e) => {
                const value = e.target.value;

                // update the value
                setData('value', value);
            }}
            {...attrs}
        />
    );
});
