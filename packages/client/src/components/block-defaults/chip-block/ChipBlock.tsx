/* eslint-disable react/jsx-no-undef */
/* eslint-disable no-undef */
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Chip, Stack } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { CSSProperties } from 'react';

export interface ChipBlockDef extends BlockDef<'chip'> {
    widget: 'chip';
    data: {
        type: string;
        label: string;
        style: CSSProperties;
        //variant: 'filled' | 'outlined';
        disabled?: boolean;
        icon?: React.ReactElement;
        size: 'small' | 'medium';
        color:
            | 'primary'
            | 'default'
            | 'pink'
            | 'green'
            | 'purple'
            | 'indigo'
            | 'turqoise'
            | 'lcgreen'
            | 'lcpink'
            | 'lcpurple'
            | 'lcindigo'
            | 'lcprimary';
        clickable?: boolean;
        src: string;
        title: string;
    };
    listeners: {
        onClick: true;
    };
    slots: never;
}

export const ChipBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ChipBlockDef>(id);

    return (
        <Stack
            {...attrs}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'fit-content',
                width: 'fit-content',
                paddingInline: '10px',
            }}
            onClick={() => {
                listeners.onClick();
            }}
        >
            {
                <Chip
                    label={data.label || null}
                    //variant={data.variant || null}
                    color={data.color}
                    size={data.size}
                    icon={data.icon || null}
                    clickable={data.clickable}
                />
            }
        </Stack>
    );
});
