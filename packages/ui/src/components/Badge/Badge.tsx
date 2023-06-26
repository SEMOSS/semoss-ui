import MuiBadge from "@mui/material/Badge";
import { SxProps } from "@mui/system";

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
     * The variant to use.
     * @default 'standard'
     */
    variant?: "standard" | "dot";
}

export const Badge = (props: BadgeProps) => {
    const { sx } = props;
    return <MuiBadge sx={sx} {...props} />;
};
