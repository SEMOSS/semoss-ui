import { CSSProperties } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Slot } from "../../blocks";
import { BoxShadowParts, buildBoxShadowFromParts } from "../block-defaults.shared";

export interface ContainerBlockDef extends BlockDef<"container"> {
    widget: "container";
    data: {
        style: CSSProperties & {
            boxShadowParts?:BoxShadowParts
        };
        show: string;
    };
    slots: {
        children: true;
    };
}
export const ContainerBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<ContainerBlockDef>(id);
    const { boxShadowParts, ...restStyle } = data.style || {};
    return (
        <div
            style={{
                ...data.style,
                display: "flex",
                overflowWrap: "anywhere", // text that overflows container
                boxShadow: buildBoxShadowFromParts(boxShadowParts),
            }}
            {...attrs}
        >
            <Slot slot={slots.children}></Slot>
        </div>
    );
});
