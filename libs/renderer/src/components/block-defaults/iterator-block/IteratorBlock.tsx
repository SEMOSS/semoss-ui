import { CSSProperties } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Slot } from "../../blocks";

export interface IteratorBlockDef extends BlockDef<"iterator"> {
    widget: "iterator";
    data: {
        style: CSSProperties;
        iterationCount: Number;
    };
    slots: {
        children: true;
    };
    listeners: {};
}

export const IteratorBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<IteratorBlockDef>(id);
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
