import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface HeaderBlockDef extends BlockDef<'header'> {
    widget: 'header';
    data: {
        style: CSSProperties;
    };
    slots: 'content';
}

export const HeaderBlock: BlockComponent = observer(
    ({ id, selectedId, isEditMode }) => {
        const { attrs, data, slots } = useBlock<HeaderBlockDef>(id);

        return (
            <header
                style={{
                    background: '#FFFFFF',
                    ...data.style,
                }}
                {...attrs}
            >
                <Slot
                    slot={slots.content}
                    selectedId={selectedId}
                    isEditMode={isEditMode}
                ></Slot>
            </header>
        );
    },
);
