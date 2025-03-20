import { CSSProperties, useState } from "react";
import { observer } from "mobx-react-lite";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { iconMap } from "../../../constants";

export interface IconBlockDef extends BlockDef<"icon"> {
    widget: "icon";
    data: {
        icon: string;
        style: CSSProperties;
        src: string;
        title: string;
    };
    slots: never;
}

export const IconBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<IconBlockDef>(id);

    const displayIcon = (key: string) => {
        const Icon = iconMap[key] || iconMap["Default"];
        const color = data.style.color || "primary";
        const width = data.style.width ?? null;
        const maxWidth = data.style.maxWidth ?? null;
        const height = data.style.height ?? null;
        const maxHeight = data.style.maxHeight ?? null;

        return <Icon sx={{ width, maxWidth, height, maxHeight, color }} />;
    };

    return (
        <div
            {...attrs}
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "fit-content",
                width: "fit-content",
                paddingInline: "10px",
            }}
        >
            {displayIcon(data.icon)}
        </div>
    );
});
