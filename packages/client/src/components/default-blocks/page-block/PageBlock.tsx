import { CSSProperties } from 'react';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { Slot } from '@/components/blocks';

export interface PageBlockDef extends BlockDef<'page'> {
    widget: 'page';
    data: {
        style: CSSProperties;
    };
    slots: 'content';
}

export const PageBlock: BlockComponent<PageBlockDef> = ({ id }) => {
    const { attrs, data, slots } = useBlock<PageBlockDef>(id);

    return (
        <div style={data.style} {...attrs}>
            <Slot slot={slots.content}></Slot>
        </div>
    );
};

PageBlock.widget = 'page';

PageBlock.config = {
    data: {
        style: {},
    },
    listeners: {},
    slots: {
        content: [],
    },
};
