import { ComponentPropsWithoutRef, ReactNode, ImgHTMLAttributes } from "react";
import MuiIcon from "@mui/material/Icon";
import { SxProps } from "@mui/system";
import { IconProps as MuiIconProps } from "@mui/material";

export interface IconProps extends MuiIconProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const Icon = (props: IconProps) => {
    const { children, sx } = props;
    return (
        <MuiIcon sx={sx} {...props}>
            {children}
        </MuiIcon>
    );
};
