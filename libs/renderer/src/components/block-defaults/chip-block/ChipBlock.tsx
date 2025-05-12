//React and Third Party Libraries
import React from "react";
import { observer } from "mobx-react-lite";
import { CSSProperties } from "react";
import { Face } from "@mui/icons-material";
import { Chip, styled } from "@mui/material";

//Internal Semoss libs
import { Avatar } from "@semoss/ui";

//Modules internal to current package
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";

export interface ChipBlockDef extends BlockDef<"chip"> {
    widget: "chip";
    data: {
        type: string;
        label: string;
        style: CSSProperties;
        variant: "filled" | "outlined";
        disabled?: boolean;
        avatar?: React.ReactElement;
        size: "small" | "medium";
        color:
            | "default"
            | "primary"
            | "secondary"
            | "success"
            | "warning"
            | "error";
        clickable?: boolean;
        multiSelect?: boolean;
        link?: string;
        icon?: React.JSX.Element;
        src: string;
        title: string;
        show: string;
    };
    listeners: {
        // onClick: true;
    };
    slots: never;
}

const StyledAvatar = styled(Avatar, {
    shouldForwardProp: (prop) => prop !== "chipColor",
})<{ chipColor: string }>(({ chipColor, theme }) => {
    const palette = theme.palette;

    return {
        "&&": {
            backgroundColor: palette[chipColor]?.main || palette.grey[500],
            color: palette[chipColor]?.contrastText,
        },
    };
});

export const ChipBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data /*listeners*/ } = useBlock<ChipBlockDef>(id);

    const displayChip = (key): React.ReactNode => {
        const avatar = data?.avatar;
        const link = data?.link || null;

        const chipProps = {
            label: data.label ?? data.type ?? "Chip",
            color: data.color,
            size: data.size,
            variant: data.variant,
            clickable: data.clickable,
        };

        switch (key) {
            case "Chip":
                return <Chip {...chipProps} />;
            case "Avatar":
                return (
                    <Chip
                        {...chipProps}
                        avatar={
                            <StyledAvatar chipColor={data.color}>
                                {avatar}
                            </StyledAvatar>
                        }
                    />
                );
            case "Icon":
                return <Chip {...chipProps} icon={<Face />} />;
            case "Link":
                return (
                    <a href={link}>
                        <Chip
                            {...chipProps}
                            onClick={(e) => e.preventDefault()}
                        />
                    </a>
                );
            default:
                return <Chip {...chipProps} />;
        }
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
            }}
            // onClick={() => {
            //     listeners.onClick();
            // }}
        >
            {displayChip(data.type)}
        </div>
    );
});
