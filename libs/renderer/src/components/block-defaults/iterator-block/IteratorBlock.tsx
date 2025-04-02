import { CSSProperties, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import {
    BlockDef,
    BlockComponent,
    BlockJSON,
    ActionMessages,
} from "../../../store";
import { Slot } from "../../blocks";
import { useBlocks } from "../../../hooks";
import { toJS } from "mobx";

export interface IteratorBlockDef extends BlockDef<"iterator"> {
    widget: "iterator";
    data: {
        style: CSSProperties;
        iterationCount: Number;
        value: any[];
        type: string;
        sourceBlockList: any[];
        test: boolean;
    };
    slots: {
        children: true;
    };
}

export const IteratorBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, slots } = useBlock<IteratorBlockDef>(id);
    const { state } = useBlocks();

    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const getJsonForBlock = (id: string, data54?: any) => {
        const block = state.blocks[id];
        let updatedBlock = block;
        if(updatedBlock.widget === "button" ){
        if (data54 !== undefined || data54 !== null) {
            updatedBlock = {
                ...block,
                data: {
                    ...block.data,
                    label: data54,
                },
            };
        }
    }
    if(updatedBlock.widget === "text" ){
        if (data54 !== undefined || data54 !== null) {
            updatedBlock = {
                ...block,
                data: {
                    ...block.data,
                    text: data54,
                },
            };
        }
    }
    if(updatedBlock.widget === "markdown" ){
        if (data54 !== undefined || data54 !== null) {
            updatedBlock = {
                ...block,
                data: {
                    ...block.data,
                    markdown: data54,
                },
            };
        }
    }
    if(updatedBlock.widget === "input" ){
        if (data54 !== undefined || data54 !== null) {
            updatedBlock = {
                ...block,
                data: {
                    ...block.data,
                    value: data54,
                },
            };
        }
    }

        const blockJson = {
            widget: toJS(updatedBlock.widget),
            data: toJS(updatedBlock.data),
            listeners: toJS(updatedBlock.listeners),
            slots: {},
        };

        // generate the slots
        for (const slot in block.slots) {
            if (block.slots[slot]) {
                blockJson.slots[slot] = block.slots[slot].children.map(
                    (childId) => {
                        return getJsonForBlock(childId);
                    },
                );
            }
        }

        // return it
        return blockJson;
    };
    useEffect(() => {
        if (data.value && data.value.length > 0 && data.test) {
            if (slots.children.children.length > 0) {
                const block = state.getBlock(slots.children.children[0]);
                const parentBlock = state.getBlock(block.parent.id);
                const children = parentBlock.slots.children.children.map(
                    (childId) => childId,
                );
                for (let i = 0; i < children.length; i++) {
                    if (!data.sourceBlockList.includes(children[i])) {
                        state.dispatch({
                            message: ActionMessages.REMOVE_BLOCK,
                            payload: {
                                id: children[i],
                                keep: false,
                            },
                        });
                    } else {
                        let block1 = state.getBlock(children[i]);
                        if(block1.widget === "button"){
                        block1.data.label = data.value[0];
                    }
                    if(block1.widget === "text"){
                        block1.data.text = data.value[0];
                    }
                    if(block1.widget === "markdown"){
                        block1.data.markdown = data.value[0];
                    }
                    if(block1.widget === "input"){
                        block1.data.value = data.value[0];
                    }
                }
                }
                for (let j = 0; j < data.sourceBlockList.length; j++) {
                    let blockId = data.sourceBlockList[j];
                    const parentSourceBlock = state.getBlock(blockId);
                    let sibilingId: string = parentSourceBlock.id;
                    for (let i = 1; i < data.value.length; i++) {
                        const id: string = state.dispatch({
                            message: ActionMessages.ADD_BLOCK,
                            payload: {
                                json: getJsonForBlock(
                                    blockId,
                                    data.value[i],
                                ) as BlockJSON,
                                position: {
                                    parent: parentSourceBlock.parent.id,
                                    slot: parentSourceBlock.parent.slot,
                                    sibling: sibilingId,
                                    type: "after",
                                },
                            },
                        }) as string;
                        if (id) {
                            sibilingId = id;
                        }
                    }
                }
            }
            setData("test", false, true);
        }
    }, [data.value]);
    return (
        <div
            style={{
                ...data.style,
                display: "flex",
                overflowWrap: "anywhere", // text that overflows container
            }}
            {...attrs}
        >
            <Slot slot={slots.children}></Slot>
        </div>
    );
});
