import MuiTooltip from "@mui/material/Tooltip";
import { SxProps } from "@mui/system";
import { TooltipProps as MuiTooltipProps } from "@mui/material";

export interface TooltipProps extends MuiTooltipProps {
    /** custom style object */
    sx?: SxProps;
}

export const Tooltip = (props: TooltipProps) => {
    const { sx } = props;
    return <MuiTooltip sx={sx} {...props} />;
};
