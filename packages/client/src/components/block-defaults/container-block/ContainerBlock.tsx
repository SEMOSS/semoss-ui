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
    slots: 'children';
}

export const ContainerBlock: BlockComponent = observer(
    ({ id, selectedId, isEditMode }) => {
        const { attrs, data, slots } = useBlock<ContainerBlockDef>(id);

        return (
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    ...data.style,
                }}
                {...attrs}
            >
                <Slot
                    slot={slots.children}
                    selectedId={selectedId}
                    isEditMode={isEditMode}
                ></Slot>
            </div>
        );
    },
);
