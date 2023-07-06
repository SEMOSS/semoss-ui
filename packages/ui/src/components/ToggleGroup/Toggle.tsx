import React from "react";
import JoyTab from "@mui/joy/Tab";
import { SxProps } from "@mui/system";

export interface ToggleProps {
    // The color of the component.
    // It supports those theme colors that make sense for this component.
    color?: "danger" | "info" | "neutral" | "primary" | "success" | "warning";

    // If true, the component is disabled.
    disabled?: boolean;

    // Callback invoked when new value is being set.
    onChange?: () => void;

    sx?: SxProps;
    children?: string;
    // You can provide your own value. Otherwise,
    //  it falls back to the child position index.
    value?: number;
    // The global variant to use.
    variant?: "outlined" | "plain" | "soft" | "solid";
}

export const Toggle = (props: ToggleProps) => {
    const { sx } = props;
    return <JoyTab sx={sx} {...props} />;
};
