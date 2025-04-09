import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock, useBlocks } from "../../../hooks";
import { ActionMessages, BlockComponent, BlockDef, BlockJSON } from "../../../store";
import { Slot } from "../../blocks";

export interface IterationBlockDef extends BlockDef<"iteration"> {
    widget: "iteration";
    data: {
        /**
         * Data source
         */
        source: string | []

        /**
         * Block that will be iterated
         */
        child: BlockJSON

        /**
         * how we will reference the index in the children
         */
        indexVariable: string;

        /**
         * Conditionally show the block
         */
        show: string;
    };
    slots: {
        children: true;
    };
}


const fixStruct = (data, lookupMap) => {
    if(typeof data === 'object' && data !== null) {
        if (data.hasOwnProperty('slots') && typeof data.slots === 'object') {
            Object.keys(data.slots).forEach((d) => {
                
                data.slots[d] = data.slots[d].children.map((id) => {
                    return fixStruct(lookupMap[id], lookupMap)
                })

            })
        }
    }

    return data
}

export const IterationBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<IterationBlockDef>(id);
    const { state } = useBlocks()

    const list = data.source

    useEffect(() => {
        // Only while we are in app using mode
        if (state.mode === 'interactive') {
            if(typeof list === 'object') {

                list.forEach(async (j) => {
                    await state.dispatch({
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: fixStruct(data.child, state.blocks),
                            position: {
                                parent: id,
                                slot: 'children',
                                sibling: data.child.id,
                                type: 'after'
                            }
                        }
                    })
                })
            }
        } 
    }, [data.child])


    return (
        <div
            style={{
                display: "flex",
                overflowWrap: "anywhere",
            }}
            {...attrs}
        >
            <Slot slot={slots.children}></Slot>
        </div>
    );
});
