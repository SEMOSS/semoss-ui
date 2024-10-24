import { ReactNode } from "react";
import { AvatarGroup as MuiAvatarGroup, SxProps } from "@mui/material";

export interface AvatarGroupProps {
    //** avatar children to be rendered */
    children?: ReactNode;

    //** shape of avatars */
    variant?: "circular" | "rounded";

    /** custom style object */
    sx?: SxProps;

    /**
     * Max avatars to show before +x.
     * @default 5
     */
    max?: number;

    /**
     * Spacing between avatars.
     * @default 'medium'
     */
    spacing?: "small" | "medium" | number;

    /**
     * The total number of avatars. Used for calculating the number of extra avatars.
     * @default children.length
     */
    total?: number;
}

export const AvatarGroup = (props: AvatarGroupProps) => {
    const { children, sx } = props;

    return (
        <MuiAvatarGroup sx={sx} {...props}>
            {children}
        </MuiAvatarGroup>
    );
};
