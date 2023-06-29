import React, { ReactNode } from "react";
import MuiTab from "@mui/material/Tab";
import { SxProps } from "@mui/system";

export interface TabProps {
    // custom style object
    icon?: string | React.ReactElement<any, any>;
    iconPosition?: "top" | "bottom" | "start" | "end";
    index?: string;
    label?: ReactNode;

    sx?: SxProps;
}

export const Tab = (props: TabProps) => {
    const { sx } = props;
    return <MuiTab sx={sx} {...props} />;
};
