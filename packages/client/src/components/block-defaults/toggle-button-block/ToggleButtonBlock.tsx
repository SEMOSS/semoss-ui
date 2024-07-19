import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { useBlock, useDebounce } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { styled, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { debounce } from '@/utility';

const StyledContainer = styled('div')(() => ({
    padding: '4px',
    width: 'fit-content',
}));

export interface ToggleButtonBlockDef extends BlockDef<'toggle-button'> {
    widget: 'toggle-button';
    data: {
        disabled: boolean;
        color: 'primary' | 'secondary';
        size: 'small' | 'medium' | 'large';
        options: Array<{ value: string; display: string }>;
        value: string | Array<string>;
        mandatory: boolean;
        multiple: boolean;
    };
}

export const ToggleButtonBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } =
        useBlock<ToggleButtonBlockDef>(id);

    const [changedValue, setChangedValue] = useState(false);

    // useDebounce(
    //     () => {
    //         listeners.onChange();
    //     },
    //     [changedValue],
    //     200,
    // );

    return (
        <StyledContainer {...attrs}>
            <ToggleButtonGroup
                disabled={data.disabled}
                size={data.size}
                color={data.color}
                onChange={(_, newValue: string | string[] | null) => {
                    if (data.mandatory) {
                        if (Array.isArray(newValue)) {
                            if (newValue.length) {
                                setData('value', newValue);
                                debounce(() => {
                                    listeners.onChange();
                                }, 200);
                                //setChangedValue(!changedValue);
                            }
                        } else {
                            if (newValue !== null) {
                                setData('value', newValue);
                                debounce(() => {
                                    listeners.onChange();
                                }, 200);
                                //setChangedValue(!changedValue);
                            }
                        }
                    } else {
                        setData('value', newValue);
                        debounce(() => {
                            listeners.onChange();
                        }, 200);
                        //setChangedValue(!changedValue);
                    }
                }}
                value={data.value}
                exclusive={!data.multiple}
            >
                {Array.from(data.options, (option, index) => {
                    return (
                        <ToggleButton
                            key={`${id}-${index}`}
                            value={option.value}
                        >
                            {option.display}
                        </ToggleButton>
                    );
                })}
            </ToggleButtonGroup>
        </StyledContainer>
    );
});
