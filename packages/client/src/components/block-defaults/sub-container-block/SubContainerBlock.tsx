import { CSSProperties, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent, ActionMessages } from '@/stores';
import { Slot } from '@/components/blocks';

export interface SubContainerBlockDef extends BlockDef<'sub-container'> {
    widget: 'sub-container';
    data: {
        id: string;
        style: CSSProperties;
        subcontainer: number;
    };
    slots: {
        children: true;
    };
}

export const SubContainerBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<SubContainerBlockDef>(id);

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
