import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface ContainerBlockDef extends BlockDef<'container'> {
    widget: 'container';
    data: {
        style: CSSProperties;
    };
    slots: {
        children: true;
    };
}

export const ContainerBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<ContainerBlockDef>(id);

    return (
        <div
            style={{
                ...data.style,
                overflowWrap: 'anywhere', // text that overflows container
            }}
            {...attrs}
        >
            <Slot slot={slots.children}></Slot>
        </div>
    );
});
