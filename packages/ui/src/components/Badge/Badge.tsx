import MuiBadge from "@mui/material/Badge";
import { SxProps } from "@mui/system";
import { BadgeProps as MuiBadgeProps } from "@mui/material";

export interface BadgeProps extends MuiBadgeProps {
    /** custom style object */
    sx?: SxProps;
}

export const Badge = (props: BadgeProps) => {
    const { sx } = props;
    return <MuiBadge sx={sx} {...props} />;
};
