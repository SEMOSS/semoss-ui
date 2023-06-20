import React from "react";
import { DialogTitle as MuiModalTitle } from "@mui/material";
import { SxProps } from "@mui/system";
import { DialogTitleProps as MuiModalTitleProps } from "@mui/material";

export interface ModalTitleProps extends MuiModalTitleProps {
    /** custom style object */
    sx?: SxProps;
}

export const ModalTitle = (props: ModalTitleProps) => {
    const { sx } = props;
    return <MuiModalTitle sx={sx} {...props} />;
};
