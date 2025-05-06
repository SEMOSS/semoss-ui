import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";

export interface IframeBlockDef extends BlockDef<"iframe"> {
    widget: "iframe";
    data: {
        style: CSSProperties;
        src: string;
        title: string;
        enableFrameInteractions: boolean;
        show: string;
    };
    slots: never;
    listeners: {
        preProcess: true;
    };
}

export const IframeBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<IframeBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    return (
        <span
            style={{
                width: "100%",
                height: "400px",
                display: "block",
                ...data.style,
            }}
            {...attrs}
        >
            <iframe
                style={{
                    width: "100%",
                    height: "100%",
                    pointerEvents: !data.enableFrameInteractions
                        ? "none"
                        : "auto",
                }}
                src={data.src}
                title={data.title}
                data-block-frame={id}
            />
        </span>
    );
});
