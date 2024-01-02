import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface FooterBlockDef extends BlockDef<'footer'> {
    widget: 'footer';
    data: {
        style: CSSProperties;
    };
    slots: 'content';
}

export const FooterBlock: BlockComponent = observer(
    ({ id, selectedId, isEditMode }) => {
        const { attrs, data, slots } = useBlock<FooterBlockDef>(id);

        return (
            <footer
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
            </footer>
        );
    },
);
