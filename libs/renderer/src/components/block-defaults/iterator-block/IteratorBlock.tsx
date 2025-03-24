import { CSSProperties, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Slot } from "../../blocks";

export interface IteratorBlockDef extends BlockDef<"iterator"> {
    widget: "iterator";
    data: {
        style: CSSProperties;
        iterationCount: Number;
        value: any;
        type: string;
    };
    slots: {
        children: true;
    };
}

export const IteratorBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, slots } = useBlock<IteratorBlockDef>(id);

    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    useEffect(() => {
        console.log(data.value, "data.value");
        if (data.value && data.value.length > 0) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData("iterationCount", data.value.length, true);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
            console.log(data.iterationCount, data, "data.iterationCount");
        } else {
            setData("iterationCount", 0, true);
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
