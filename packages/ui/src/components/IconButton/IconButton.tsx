import { ComponentPropsWithoutRef, ReactNode, ImgHTMLAttributes } from "react";
import MuiIconButton from "@mui/material/IconButton";
import { SxProps } from "@mui/system";
import { IconButtonProps as MuiIconButtonProps } from "@mui/material";

export interface IconButtonProps extends MuiIconButtonProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const IconButton = (props: IconButtonProps) => {
    const { children, sx } = props;
    return (
        <MuiIconButton sx={sx} {...props}>
            {children}
        </MuiIconButton>
    );
};
