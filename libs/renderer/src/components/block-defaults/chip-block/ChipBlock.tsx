import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { CSSProperties } from "react";
import { Face } from "@mui/icons-material";
import { darken } from "@mui/material/styles";
import { Chip, styled } from "@mui/material";

import { Avatar } from "@semoss/ui";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { iconMap } from "../../../constants";

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
        clickable?: boolean;
        multiSelect?: boolean;
        link?: string;
        icon?: string;
        src: string;
        title: string;
        show: string;
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
    slots: never;
}

export const ChipBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ChipBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const getContrastColor = (hexColor: string) => {
        hexColor = hexColor.replace("#", "");

        // Parse hex values to RGB
        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        return brightness >= 128 ? "#000000" : "#FFFFFF";
    };

    const displayChip = (key): React.ReactNode => {
        const avatar = data?.avatar;
        const link = data?.link || null;
        const color = data.style.color || "Default";
        const avatarColor = data.style.color || "rgb(156, 153, 153)";
        const Icon = iconMap[data.icon] || iconMap["Face"];

        const chipProps = {
            label: data.label ?? data.type ?? "Chip",
            size: data.size,
            variant: data.variant,
            clickable: data.clickable,
            sx: {
                backgroundColor: data.variant !== "outlined" && color,
                color:
                    data.variant !== "outlined"
                        ? data.style.color
                            ? getContrastColor(data.style.color)
                            : "black"
                        : color,
                border:
                    data.variant === "outlined" &&
                    data.style.color &&
                    `solid ${color}`,
            },
        };

        switch (key) {
            case "Chip":
                return <Chip {...chipProps} />;
            case "Avatar":
                return (
                    <Chip
                        {...chipProps}
                        avatar={
                            <Avatar
                                sx={{
                                    "&&": {
                                        backgroundColor:
                                            data.style.color &&
                                            data.variant === "outlined"
                                                ? darken(avatarColor, 0.4)
                                                : "Default",
                                        color:
                                            data.variant !== "outlined" &&
                                            getContrastColor(color),
                                    },
                                }}
                            >
                                {avatar}
                            </Avatar>
                        }
                    />
                );
            case "Icon":
                return (
                    <Chip
                        {...chipProps}
                        icon={
                            <Icon
                                sx={{
                                    "&&": {
                                        backgroundColor:
                                            data.style.color &&
                                            data.variant === "outlined"
                                                ? darken(avatarColor, 0.4)
                                                : "Default",
                                        color:
                                            data.variant !== "outlined" &&
                                            getContrastColor(color),
                                    },
                                }}
                            />
                        }
                    />
                );
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
