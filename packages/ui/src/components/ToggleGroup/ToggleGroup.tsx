import React, { ReactNode } from "react";
import JoyTabs from "@mui/joy/Tabs";
import { SxProps } from "@mui/system";

export interface ToggleGroupProps {
    sx?: SxProps;
    children?: ReactNode;
    // The component orientation (layout flow direction).
    orientation?: "horizontal" | "vertical";
    // The default value. Use when the component is not controlled.
    defaultValue?: number;
    // The color of the component.
    // It supports those theme colors that make sense for this component.
    color?: "danger" | "info" | "neutral" | "primary" | "success" | "warning";

    // Callback invoked when new value is being set.
    onChange?: () => void;

    // The size of the component.
    size?: "sm" | "md" | "lg";

    // The global variant to use.
    variant?: "outlined" | "plain" | "soft" | "solid";

    // The value of the currently selected Tab.
    // If you don't want any selected Tab, you can set this prop to null
    value?: number;
}

export const ToggleGroup = (props: ToggleGroupProps) => {
    const { sx } = props;
    return <JoyTabs sx={sx} {...props} />;
};
