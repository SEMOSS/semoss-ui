import { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";

import { useBlock, useBlocks } from "../../../hooks";
import {
    ActionMessages,
    Block,
    BlockComponent,
    BlockDef,
    BlockJSON,
} from "../../../store";
import { Slot } from "../../blocks";

export interface IterationBlockDef extends BlockDef<"iteration"> {
    widget: "iteration";
    data: {
        /**
         * CSS Properties
         */
        style: CSSProperties;

        /**
         * Data source
         */
        source: string | [];

        /**
         * Block that will be iterated
         */
        child: Block;

        /**
         * Conditionally show the block
         */
        show: string;
    };
    slots: {
        children: true;
    };
}

export const IterationBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<IterationBlockDef>(id);
    const { state } = useBlocks();

    const [blocksToRemove, setBlocksToRemove] = useState([]);

    let list 
    if (typeof data.source === "string") {
        try {
            list = JSON.parse(data.source);
        } catch {
            list = data.source
        }
    }

    /**
     * Add Blocks at runtime
     */
    useEffect(() => {
        // Only while we are in app using mode
        if (state.mode === "interactive") {
            if (typeof list === "object") {
                console.log(list.length);
                const newIds = [];

                blocksToRemove.forEach(async (b) => {
                    await state.dispatch({
                        message: ActionMessages.REMOVE_BLOCK,
                        payload: {
                            id: b,
                            keep: false
                        }
                    })
                })

                list.forEach(async (j, i) => {
                    // Skip the first
                    if (i === 0) return;

                    const getJsonForBlock = (id: string) => {
                        const block = state.blocks[id];

                        const blockJson = {
                            widget: toJS(block.widget),
                            data: toJS(block.data),
                            listeners: toJS(block.listeners),
                            slots: {},
                        };

                        // generate the slots
                        for (const slot in block.slots) {
                            if (block.slots[slot]) {
                                blockJson.slots[slot] = block.slots[
                                    slot
                                ].children.map((childId) => {
                                    return getJsonForBlock(childId);
                                });
                            }
                        }
                        // return it
                        return blockJson;
                    };

                    const position = {
                        parent: id,
                        slot: data.child.parent.slot,
                        sibling: data.child.id,
                        type: "after",
                    };

                    const newBlockId = await state.dispatch({
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: getJsonForBlock(data.child.id) as BlockJSON,
                            position: position,
                        },
                    });

                    newIds.push(newBlockId)
                });

                setBlocksToRemove(newIds)
            }
        }
        // TODO: FIx Dependency array
    }, [JSON.stringify(list), JSON.stringify(data.child)]);

    return (
        <div
            style={{
                ...data.style,
                display: "flex",
                overflowWrap: "anywhere",
            }}
            {...attrs}
        >
            <Slot slot={slots.children}></Slot>
        </div>
    );
});
