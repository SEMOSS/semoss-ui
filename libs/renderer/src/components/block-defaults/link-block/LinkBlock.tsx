import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Slot } from "../../blocks";

export interface LinkBlockDef extends BlockDef<"link"> {
    widget: "link";
    data: {
        style: CSSProperties;
        href: string;
        text: string;
        show: string;
    };
    listeners: {
        preProcess: true;
    };
}

/*
TODO: If this is a link to somewhere internally on app switch to a Link (react-router)
*/
export const LinkBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<LinkBlockDef>(id);
    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);
    return (
        <a
            href={data.href}
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            {data.text}
        </a>
    );
});
