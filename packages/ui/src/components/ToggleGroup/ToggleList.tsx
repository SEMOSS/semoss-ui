import React, { ReactNode } from "react";
import JoyTabList from "@mui/joy/TabList";
import { SxProps } from "@mui/system";

export interface ToggleListProps {
    sx?: SxProps;
    children?: ReactNode;
    // The color of the component.
    // It supports those theme colors that make sense for this component.
    color?: "danger" | "info" | "neutral" | "primary" | "success" | "warning";

    // The size of the component.
    size?: "sm" | "md" | "lg";

    // The global variant to use.
    variant?: "outlined" | "plain" | "soft" | "solid";
}

export const ToggleList = (props: ToggleListProps) => {
    const { sx } = props;
    return <JoyTabList sx={sx} {...props} />;
};
