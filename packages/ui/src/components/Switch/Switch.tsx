import MuiSwitch from "@mui/material/Switch";
import { SxProps } from "@mui/system";
import { SwitchProps as MuiSwitchProps } from "@mui/material";

export interface SwitchProps extends MuiSwitchProps {
    /** custom style object */
    sx?: SxProps;
}

export const Switch = (props: SwitchProps) => {
    const { sx } = props;
    return <MuiSwitch sx={sx} {...props} />;
};
