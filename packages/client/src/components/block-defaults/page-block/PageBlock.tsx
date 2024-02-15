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
    slots: {
        content: true;
    };
}

export const PageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<PageBlockDef>(id);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#FFFFFF',
                overflow: 'scroll',
                ...data.style,
            }}
            {...attrs}
            data-page
        >
            <Slot slot={slots.content}></Slot>
        </div>
    );
});
