import { CSSProperties, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";

import { Slot } from "../../blocks";
import { useBlock, useBlocks } from "../../../hooks";
import {
    BlockDef,
    BlockComponent,
    BlockJSON,
    ActionMessages,
} from "../../../store";

export interface IterBlockDef extends BlockDef<"iter"> {
    widget: "iter";
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

export const IterBlock: BlockComponent = observer(({ id }: { id: string }) => {
    const { attrs, data, setData, slots } = useBlock<IterBlockDef>(id);
    const { state } = useBlocks();

    const [listLength, setListLength] = useState(0);
    const [blockIds, setBlockIds] = useState([]);



    const list = data.value
    console.log(list)
    
    useEffect(() => {
        console.log("Add blocks to children of the Iterator Block dynamically as {{array}} changes")

        if(typeof list === 'object') {
            const list_of_blocks = []

            debugger
            if(list.length !== blockIds.length) {
                console.log('cleanup old blocks')
                blockIds.forEach((b) => {
                    state.dispatch({
                        message: ActionMessages.REMOVE_BLOCK,
                        payload: {
                            id: b,
                            keep: false,
                        },
                    });
                })
            }
            list.forEach(() => {

                // TODO: This should never get saved on state
                // We need to clean this up everytime array changes
                const new_id = state.dispatch({
                    message: ActionMessages.ADD_BLOCK,
                    payload: {
                        json: {
                            "widget": "text",
                            "data": {
                                "style": {
                                    "padding": "4px",
                                    "whiteSpace": "pre-line",
                                    "textOverflow": "ellipsis"
                                },
                                "text": "array[i]",
                                "variant": "p",
                                "show": "true"
                            },
                            "listeners": {},
                            "slots": {}
                        }, 
                        position: {
                            parent: id,
                            slot: 'children'
                        }
                    }
                })

                list_of_blocks.push(new_id)
            })

            setBlockIds(list_of_blocks)
        }


        return () => {
            console.log('Clean Up')
        }
    }, [JSON.stringify(list)])

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
