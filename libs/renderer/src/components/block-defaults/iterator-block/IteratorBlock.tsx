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
        iteratorDropDownChange: boolean;
    };
    slots: {
        children: true;
    };
}

export const IteratorBlock: BlockComponent = observer(({ id }: { id: string }) => {
    const { attrs, data, setData, slots } = useBlock<IteratorBlockDef>(id);
    const { state } = useBlocks();

    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const getJsonForBlock = (blockJsonInput: any, data54?: any) => {
        let updatedBlock = { ...blockJsonInput }; // Use the object directly
    
        if (updatedBlock.widget === "button" && data54 !== undefined) {
            updatedBlock.data = { ...updatedBlock.data, label: data54 };
        }
    
        if (updatedBlock.widget === "text" && data54 !== undefined) {
            updatedBlock.data = { ...updatedBlock.data, text: data54 };
        }
    
        if (updatedBlock.widget === "markdown" && data54 !== undefined) {
            updatedBlock.data = { ...updatedBlock.data, markdown: data54 };
        }
    
        if (updatedBlock.widget === "input" && data54 !== undefined) {
            updatedBlock.data = { ...updatedBlock.data, value: data54 };
        }
    
        const blockJson = {
            widget: toJS(updatedBlock.widget),
            data: toJS(updatedBlock.data),
            listeners: toJS(updatedBlock.listeners),
            slots: {},
        };
    
        // Generate the slots
        if (updatedBlock.slots) {
            for (const slot in updatedBlock.slots) {
                if (updatedBlock.slots[slot]) {
                    blockJson.slots[slot] = updatedBlock.slots[slot].map((child) =>
                        getJsonForBlock(child,data54), // Recursively call for child blocks
                    );
                }
            }
        }
    
        return blockJson;
    };
    useEffect(() => {
        if (data.value && data.value.length > 0 && data.iteratorDropDownChange) {
            if (slots.children.children.length > 0) {
                const block = state.getBlock(slots.children.children[0]);
                const parentBlock = state.getBlock(block.parent.id);
                const children = [...parentBlock.slots.children.children];
                // Clear sourceBlockList before adding new blocks
                parentBlock.data.sourceBlockList = [];
    
                // Add new blocks and push block objects into sourceBlockList
                for (let j = 0; j < data.sourceBlockList.length; j++) {
                    let block = data.sourceBlockList[j];
                    let blockJson = block.json;
                    let blockId = block.id;
                    const parentSourceBlock = state.getBlock(blockId);
                    let siblingId: string = parentSourceBlock.id;
    
                    for (let i = 0; i < data.value.length; i++) {
                        let blockObject = {
                            json: getJsonForBlock(blockJson, data.value[i]) as BlockJSON,
                            id: siblingId,
                        };
    
                        const id: string = state.dispatch({
                            message: ActionMessages.ADD_BLOCK,
                            payload: {
                                json: blockObject.json,
                                position: {
                                    parent: parentSourceBlock.parent.id, // Using stored parent ID
                                    slot: parentSourceBlock.parent.slot, // Using stored slot name
                                    sibling: siblingId,
                                    type: "after",
                                },
                            },
                        }) as string;
                        blockObject.id = id;
                        // Update the block object with the new ID
                        
   
                        if (i === 0) {
                            // Push the entire block object instead of just id
                            (parentBlock.data.sourceBlockList as object[]).push(blockObject);
                        }
                        if (id) {
                            siblingId = id;
                        }
    
                        
                    }
                }
    
                // Now remove all previous child blocks after processing
                children.forEach((childId) => {
                    state.dispatch({
                        message: ActionMessages.REMOVE_BLOCK,
                        payload: {
                            id: childId,
                            keep: false,
                        },
                    });
                });
            }
            setData("iteratorDropDownChange", false, true);
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
