import { useState, useEffect } from "react";
import { CSSProperties } from "react";
import { observer } from "mobx-react-lite";

import { useBlock, useBlocks } from "../../../hooks";
import { ActionMessages, BlockComponent, BlockDef } from "../../../store";
import { Slot } from "../../blocks";

export interface IterBlockDef extends BlockDef<"iter"> {
    widget: "iter";
    data: {
        show: string;

        /**
         * Data Source
         */
        source: string | []
    };
    slots: {
        children: true;
    };
}

export const IterBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, slots } = useBlock<IterBlockDef>(id);
    const { state } = useBlocks();

    const [listLength, setListLength] = useState(0);
    const [blockIds, setBlockIds] = useState([]);

    const list = data.source
    console.log('The list to iterate', list)

    // TODO: Think about this
    // Do we want to show only one element while in static mode so they are designing one element
    // AND
    // While in app usage mode we show all iterations
    
    useEffect(() => {
        console.log("Add blocks to children of the Iterator Block dynamically as {{array}} changes")

        if(typeof list === 'object') {
            const list_of_blocks = []

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
                display: "flex",
                overflowWrap: "anywhere",
            }}
            {...attrs}
        >
            <Slot slot={slots.children}></Slot>
        </div>
    );
});
