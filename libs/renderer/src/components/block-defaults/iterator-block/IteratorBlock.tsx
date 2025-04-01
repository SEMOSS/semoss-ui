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
        console.log(data54, typeof data54, "id");
        const block = state.blocks[id];
        debugger;
        console.log(block, "block123");
        let updatedBlock = block;
        if (data54 !== undefined || data54 !== null) {
            updatedBlock = {
                ...block,
                data: {
                    ...block.data,
                    label:
                        typeof data54 === "object"
                            ? data54.label.toString()
                            : data54.toString(),
                },
            };
        }
        // let updatedBlock = {...block, data: {...block.data, label: typeof data === "object"? data.label.toString(): data.toString()}}

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
        console.log(data.value, "data.value");
        if (data.value && data.value.length > 0 && data.test) {
            debugger;
            if (slots.children.children.length > 0) {
                const block = state.getBlock(slots.children.children[0]);
                const parentBlock = state.getBlock(block.parent.id);
                console.log(parentBlock, "parentBlock");
                console.log(block, "block");
                const children = parentBlock.slots.children.children.map(
                    (childId) => childId,
                );
                for (let i = 0; i < children.length; i++) {
                    debugger;
                    console.log(parentBlock, children, "parentBlock in loop");
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
                        block1.data.label =
                            typeof data.value[0] === "object"
                                ? data.value[0].label
                                : data.value[0];
                    }
                }
                for (let j = 0; j < data.sourceBlockList.length; j++) {
                    let blockId = data.sourceBlockList[j];
                    const parentSourceBlock = state.getBlock(blockId);
                    debugger;

                    let sibilingId: string = parentSourceBlock.id;
                    for (let i = 1; i < data.value.length; i++) {
                        console.log(data.value, data.value[i], "data.value");
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
            console.log(data.iterationCount, data, "data.iterationCount");
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
