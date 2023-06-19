import MuiPopover from "@mui/material/Popover";
import { SxProps } from "@mui/system";
import { PopoverProps as MuiPopoverProps } from "@mui/material";

export interface PopoverProps extends MuiPopoverProps {
    /** custom style object */
    sx?: SxProps;
}

export const Popover = (props: PopoverProps) => {
    const { sx } = props;
    return <MuiPopover sx={sx} {...props} />;
};
