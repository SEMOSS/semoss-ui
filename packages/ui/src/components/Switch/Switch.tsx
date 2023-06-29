import { ReactNode } from "react";
import MuiSwitch from "@mui/material/Switch";
import { SxProps } from "@mui/system";

export interface SwitchProps {
    /**
     * If `true`, the ripples are centered.
     * They won't start at the cursor interaction position.
     * @default false
     */
    centerRipple?: boolean;

    // If true, the component is checked.
    checked?: boolean;
    /**
     * The icon to display when the component is checked.
     */
    checkedIcon: ReactNode;
    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'primary'
     */
    color?: "default" | "primary" | "secondary" | "error" | "info" | "warning";
    /** Whether the icon defaults to checked */
    defaultChecked?: boolean;
    /**
     * If `true`, the component is disabled.
     */
    disabled?: boolean;
    // If true, the ripple effect is disabled.
    disableRipple?: boolean;

    /**
     * If `true`, the touch ripple effect is disabled.
     * @default false
     */
    disableTouchRipple?: boolean;

    // If given, uses a negative margin to counteract the padding on one side
    //  (this is often helpful for aligning the left or right side of the icon with content
    //  above or below, without ruining the border size and shape).
    edge?: "end" | "start" | false;

    /**
     * If `true`, the base button will have a keyboard focus ripple.
     * @default false
     */
    focusRipple?: boolean;

    // Callback fired when the state is changed.
    onChange?: () => void;

    // If true, the input element is required.
    required?: boolean;
    /**
     * The size of the component.
     * `small` is equivalent to the dense switch styling.
     * @default 'medium'
     */
    size?: "medium" | "small";
    /**
     * The value of the component. The DOM API casts this to a string.
     * The browser uses "on" as the default value.
     */
<<<<<<< HEAD
    value?: boolean;
=======
    value?: any;
>>>>>>> ddfe6a8 (corrected types)
    sx?: SxProps;
}

export const Switch = (props: SwitchProps) => {
    const { sx } = props;
    return <MuiSwitch sx={sx} {...props} />;
};
