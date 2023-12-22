import React from 'react';

import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { Checkbox, FormControlLabel } from '@mui/material';

export interface CheckboxBlockDef extends BlockDef<'checkbox'> {
    widget: 'checkbox';
    data: {
        style: CSSProperties;
        value: boolean;
        label: string;
        required: boolean;
        disabled: boolean;
    };
    listeners: {
        onClick: true;
    };
}

export const CheckboxBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<CheckboxBlockDef>(id);

    return (
        <FormControlLabel
            style={{
                ...data.style,
            }}
            label={data.label}
            disabled={data.disabled}
            required={data.required}
            control={
                <Checkbox
                    checked={data.value}
                    onChange={(e) => {
                        const value = e.target.checked;

                        // update the value
                        setData('value', value);
                    }}
                    {...attrs}
                />
            }
        />
    );
});
