import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { useDebounce } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { LinearProgress, TextField, styled } from '@mui/material';

const StyledTextField = styled(TextField)({
    '& .MuiFormLabel-root.MuiInputLabel-root': {
        top: 'auto',
        left: 'auto',
    },
});
export interface InputBlockDef extends BlockDef<'input'> {
    widget: 'input';
    data: {
        style: CSSProperties;
        label: string;
        value: string | number;
        type: string;
        rows: number;
        multiline: boolean;
        required: boolean;
        disabled: boolean;
        hint?: string;
        loading?: boolean;
    };
}

export const InputBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<InputBlockDef>(id);

    useDebounce(
        () => {
            listeners.onChange();
        },
        [listeners, data.value],
        500,
    );

    return (
        <StyledTextField
            size="small"
            value={data.value}
            label={
                typeof data.label !== 'string'
                    ? JSON.stringify(data.label)
                    : data.label
            }
            rows={data.rows}
            multiline={data.rows > 1 && data.type === 'text'}
            required={data.required}
            disabled={data?.disabled || data?.loading}
            helperText={
                data?.loading ? <LinearProgress color="primary" /> : data?.hint
            }
            style={{
                ...data.style,
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
