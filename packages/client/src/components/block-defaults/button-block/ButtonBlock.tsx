import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { Slot } from '@/components/blocks';

export interface ButtonBlockDef extends BlockDef<'button'> {
    widget: 'button';
    data: {
        style: CSSProperties;
    };
    listeners: {
        onClick: true;
    };
    slots: 'text';
}

export const ButtonBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots, listeners } = useBlock<ButtonBlockDef>(id);

    return (
        <button
            style={{
                ...data.style,
            }}
            onClick={() => {
                console.log('click');
                // trigger the listeners
                listeners.onClick();
            }}
            {...attrs}
        >
            <Slot slot={slots.text} />
        </button>
    );
});
