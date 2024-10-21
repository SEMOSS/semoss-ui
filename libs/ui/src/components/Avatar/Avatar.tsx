import { ReactNode } from "react";
import { Avatar as MuiAvatar, SxProps } from "@mui/material";

export interface AvatarProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;

    //** shape of avatar */
    variant?: "circular" | "rounded";

    /**
     * The `sizes` attribute for the `img` element.
     */
    sizes?: string;

    /**
     * The `src` attribute for the `img` element.
     */
    src?: string;

    /**
     * The `srcSet` attribute for the `img` element.
     * Use this attribute for responsive image display.
     */
    srcSet?: string;
}

export const Avatar = (props: AvatarProps) => {
    const { children, sx } = props;

    return (
        <MuiAvatar sx={sx} {...props}>
            {children}
        </MuiAvatar>
    );
};
