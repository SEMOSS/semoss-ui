import { CSSProperties, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent, ActionMessages } from '@/stores';
import { Slot } from '@/components/blocks';

export interface ContainerBlockDef extends BlockDef<'container'> {
    widget: 'container';
    data: {
        style: CSSProperties;
        subcontainer: number;
    };
    slots: {
        children: true;
    };
}

export const ContainerBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<ContainerBlockDef>(id);
    const { state } = useBlocks();

    useEffect(() => {
        let iterator = 0;
        const totalChildren = slots?.children?.children?.length
            ? [...slots.children.children]
            : [];

        // check if total children is greater than subcontainer
        if (totalChildren && totalChildren?.length > data.subcontainer) {
            // remove the extra children
            while (iterator < totalChildren?.length - data.subcontainer) {
                iterator += 1;
                state.dispatch({
                    message: ActionMessages.REMOVE_BLOCK,
                    payload: {
                        id: totalChildren[iterator - 1],
                        keep: false,
                    },
                });
            }
        } else if (totalChildren && totalChildren?.length < data.subcontainer) {
            // add the extra children
            while (iterator < data.subcontainer - totalChildren?.length) {
                iterator += 1;
                state.dispatch({
                    message: ActionMessages.ADD_BLOCK,
                    payload: {
                        json: {
                            widget: 'sub-container',
                            data: {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '4px',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                },
                                subcontainer: 2,
                            },
                            listeners: {},
                            slots: {
                                children: [],
                            },
                        },
                        position: {
                            parent: id,
                            slot: 'children',
                            sibling: null,
                            type: 'after',
                        },
                    },
                });
            }
        }
    }, [data.subcontainer]);

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
