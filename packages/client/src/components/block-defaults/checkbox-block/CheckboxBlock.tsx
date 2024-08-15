import React from 'react';

import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { Checkbox, FormControlLabel, styled } from '@mui/material';
import { debounced } from '@/utility';

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
        onChange: true;
    };
}

const StyledContainer = styled('div')(({ theme }) => ({
    padding: theme.spacing(0.5),
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
    padding: theme.spacing(0),
}));

export const CheckboxBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<CheckboxBlockDef>(id);

    const debouncedCallback = debounced(() => {
        listeners.onChange();
    }, 200);

    return (
        <StyledContainer {...attrs}>
            <StyledCheckbox
                style={{
                    ...data.style,
                }}
                disabled={data.disabled}
                checked={data.value}
                onChange={(e) => {
                    const value = e.target.checked;
                    // update the value
                    setData('value', value);
                    debouncedCallback();
                }}
            />
        </StyledContainer>
    );
});
