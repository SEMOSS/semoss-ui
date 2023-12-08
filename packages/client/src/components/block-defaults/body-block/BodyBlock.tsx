import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface BodyBlockDef extends BlockDef<'body'> {
    widget: 'body';
    data: {
        style: CSSProperties;
    };
    slots: 'content';
}

export const BodyBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<BodyBlockDef>(id);

    return (
        <body
            style={{
                background: '#FFFFFF',
                ...data.style,
            }}
            {...attrs}
        >
            <Slot slot={slots.content}></Slot>
        </body>
    );
});
