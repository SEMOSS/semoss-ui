import { ReactNode } from "react";
import MuiSwitch from "@mui/material/Switch";
import { SxProps } from "@mui/system";
import { SwitchProps as MuiSwitchProps } from "@mui/material";

export interface SwitchProps extends MuiSwitchProps {
    /** custom style object */
    checked?: boolean;
    checkedIcon: ReactNode;
    color?: "default" | "primary" | "secondary" | "error" | "info" | "warning";
    defaultChecked?: boolean;
    disabled?: boolean;
    disableRipple?: boolean;
    edge?: "end" | "start" | false;
    onChange?: () => void;
    required?: boolean;
    size?: "medium" | "small";
    value?: any;
    sx?: SxProps;
}

export const Switch = (props: SwitchProps) => {
    const { sx } = props;
    return <MuiSwitch sx={sx} {...props} />;
};
