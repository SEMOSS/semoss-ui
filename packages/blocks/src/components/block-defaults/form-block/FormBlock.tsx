import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface FormBlockDef extends BlockDef<'form'> {
    widget: 'form';
    data: {
        style: CSSProperties;
    };
    slots: 'children';
}

export const FormBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<FormBlockDef>(id);

    return (
        <form
            style={{
                display: 'flex',
                ...data.style,
            }}
            {...attrs}
        >
            <Slot slot={slots.children}></Slot>
            <Button
                sx={{
                    ...data.style,
                }}
                onClick={() => {
                    listeners.onClick();
                }}
                {...attrs}
            >
                {data.label}
            </Button>
        </form>
    );
});
