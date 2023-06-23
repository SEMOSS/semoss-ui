import React, { ReactNode } from "react";
import MuiTabs from "@mui/material/Tabs";
import { SxProps } from "@mui/system";
import { TabsProps as MuiTabsProps } from "@mui/material";

export interface TabsProps {
    // custom style object
    sx?: SxProps;
    centered?: boolean;
    children?: ReactNode;
    indicatorColor?: "secondary" | "primary";
    onChange: () => void;
    orientation?: "horizontal" | "vertical";
    textColor?: "secondary" | "primary" | "inherit";
    value?: any;
    variant?: "standard" | "scrollable" | "fullWidth";
}

export const Tabs = (props: TabsProps) => {
    const { sx } = props;
    return <MuiTabs sx={sx} {...props} />;
};
