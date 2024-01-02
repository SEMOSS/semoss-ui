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

export const PageBlock: BlockComponent = observer(
    ({ id, selectedId, isEditMode }) => {
        const { attrs, data, slots } = useBlock<PageBlockDef>(id);

        return (
            <div
                style={{
                    width: '100%',
                    minHeight: '100%',
                    background: '#FFFFFF',
                    overflow: 'scroll',
                    ...data.style,
                }}
                {...attrs}
            >
                <Slot
                    slot={slots.content}
                    selectedId={selectedId}
                    isEditMode={isEditMode}
                ></Slot>
            </div>
        );
    },
);
