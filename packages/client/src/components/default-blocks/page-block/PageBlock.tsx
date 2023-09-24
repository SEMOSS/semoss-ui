import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface PageBlockDef extends BlockDef<'page'> {
    widget: 'page';
    data: {
        style: CSSProperties;
    };
    slots: 'content';
}

export const PageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock(id);

    return (
        <div style={data.style} {...attrs}>
            <Slot slot={slots.content}></Slot>
        </div>
    );
});
