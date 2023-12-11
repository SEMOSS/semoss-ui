import {
    styled,
    CircularProgress,
    Badge as MuiBadge,
    SxProps,
} from "@mui/material";

const StyledCircularProgress = styled(CircularProgress)(() => ({
    color: "#fff",
}));

export interface BadgeOrigin {
    vertical: "top" | "bottom";
    horizontal: "left" | "right";
}

export interface BadgeProps {
    /** custom style object */
    sx?: SxProps;

    /**
     * The anchor of the badge.
     * @default {
     *   vertical: 'top',
     *   horizontal: 'right',
     * }
     */
    anchorOrigin?: BadgeOrigin;

    /** count of badges */
    badgeContent?: number;

    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'default'
     */
    color?:
        | "primary"
        | "secondary"
        | "default"
        | "error"
        | "info"
        | "success"
        | "warning";

    /**
     * Wrapped shape the badge should overlap.
     * @default 'rectangular'
     */
    overlap?: "rectangular" | "circular";

    /**
     * Set loading state
     */
    loading?: boolean;

    /**
     * The variant to use.
     * @default 'standard'
     */
    variant?: "standard" | "dot";
}

export const Badge = (props: BadgeProps) => {
    let muiBadgeProps = { ...props };
    if (muiBadgeProps?.loading) {
        delete muiBadgeProps.loading;
    }

    return (
        <MuiBadge
            {...muiBadgeProps}
            sx={{
                padding: 0,
                ...props?.sx,
            }}
            badgeContent={
                props?.loading && props?.badgeContent ? (
                    <StyledCircularProgress size="1em" />
                ) : (
                    props?.badgeContent
                )
            }
        />
    );
};
