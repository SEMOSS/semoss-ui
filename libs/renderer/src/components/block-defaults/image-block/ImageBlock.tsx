import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
// import ImageSkeleton from "../../../assets/ImageSkeleton.png";

export interface ImageBlockDef extends BlockDef<"image"> {
    widget: "image";
    data: {
        style: CSSProperties;
        src: string;
        title: string;
        show: string;
    };
    slots: never;
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

export const ImageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ImageBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    return (
        <div
            style={{
                ...data.style,
                backgroundImage: `url(${!data.src ? "" : data.src})`,
            }}
            {...attrs}
        />
    );
});
