import { ReactNode } from "react";
import MuiAvatarGroup, {
    AvatarGroupProps as MuiAvatarGroupProps,
} from "@mui/material/AvatarGroup";
import { SxProps } from "@mui/system";

export interface AvatarGroupProps extends MuiAvatarGroupProps {
    children?: ReactNode;
    variant?: "circular" | "rounded";
    sx?: SxProps;
}

export const AvatarGroup = (props: AvatarGroupProps) => {
    const { children, sx } = props;

    return (
        <MuiAvatarGroup sx={sx} {...props}>
            {children}
        </MuiAvatarGroup>
    );
};
