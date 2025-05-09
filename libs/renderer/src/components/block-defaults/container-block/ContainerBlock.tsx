import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

export interface ContainerBlockDef extends BlockDef<"container"> {
    widget: "container";
    data: {
        style: CSSProperties;
        show: string;
        type: "custom" | "grid";
        dimension?: null | string;
        rowSpacing?: null | string;
    };
    slots: {
        children: true;
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

export const ContainerBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots, listeners } = useBlock<ContainerBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

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
