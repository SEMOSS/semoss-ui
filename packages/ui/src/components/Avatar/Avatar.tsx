import { ReactNode } from "react";
import MuiAvatar from "@mui/material/Avatar";
import { SxProps } from "@mui/system";
import { AvatarProps as MuiAvatarProps } from "@mui/material";

export interface AvatarProps extends MuiAvatarProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;

    //** shape of avatar */
    variant?: "circular" | "rounded";
}

export const Avatar = (props: AvatarProps) => {
    const { children, sx } = props;

    return (
        <MuiAvatar sx={sx} {...props}>
            {children}
        </MuiAvatar>
    );
};
