import React, { ReactNode } from "react";
import MuiTooltip from "@mui/material/Tooltip";
import { SxProps } from "@mui/system";
export interface TooltipProps {
    /** custom style object */
    children: React.ReactElement<any, any>;
    title: ReactNode | string;
    sx?: SxProps;
    arrow?: boolean;
    enterDelay?: number;
    onClose?: () => void;
    onOpen?: () => void;
    open?: boolean;
    placement?:
        | "bottom-end"
        | "bottom-start"
        | "bottom"
        | "left-end"
        | "left-start"
        | "left"
        | "right-end"
        | "right-start"
        | "right"
        | "top-end"
        | "top-start"
        | "top";
}

export const Tooltip = (props: TooltipProps) => {
    const { sx } = props;
    return <MuiTooltip sx={sx} {...props} />;
};
