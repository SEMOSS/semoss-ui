import { CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
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
}

export const ImageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<ImageBlockDef>(id);

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
