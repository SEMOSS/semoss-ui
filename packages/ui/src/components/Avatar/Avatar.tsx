import { ReactNode } from "react";
import { CircularProgress, Avatar as MuiAvatar, SxProps } from "@mui/material";

export interface AvatarProps {
    /** children to be rendered */
    children?: ReactNode;

    /**
     * Set loading state
     */
    loading?: boolean;

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
    let muiAvatarProps = { ...props };
    if (muiAvatarProps?.loading) {
        delete muiAvatarProps.loading;
    }

    return (
        <MuiAvatar {...muiAvatarProps}>
            {props?.loading ? (
                <CircularProgress color="inherit" size="1em" />
            ) : (
                props.children
            )}
        </MuiAvatar>
    );
};
