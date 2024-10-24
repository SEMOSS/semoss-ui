import { ReactNode } from "react";
import { Switch as MuiSwitch, SxProps, styled } from "@mui/material";

const StyledSwitch = styled(MuiSwitch)(({ theme }) => ({
    width: "52px",
    height: "32px",
    padding: 0,

    "& .MuiSwitch-switchBase": {
        padding: 0,
        margin: "4px",
        transitionDuration: "300ms",

        "&.Mui-checked": {
            transform: "translateX(20px)",
            color: "#fff",

            "& + .MuiSwitch-track": {
                backgroundColor: theme.palette.primary.main,
                opacity: 1,
                border: 0,
            },

            "&.Mui-disabled + .MuiSwitch-track": {
                backgroundColor: theme.palette.secondary.main,
            },
        },

        "&.Mui-disabled + .MuiSwitch-track": {
            opacity: theme.palette.secondary.main,
        },
    },

    "& .MuiSwitch-thumb": {
        boxSizing: "border-box",
        width: "24px",
        height: "24px",
        color: theme.palette.background.paper,
    },

    "& .MuiSwitch-track": {
        borderRadius: "17px",
        backgroundColor: theme.palette.secondary.dark,
        opacity: 1,
        transition: theme.transitions.create(["background-color"], {
            duration: 500,
        }),
    },
}));

export interface SwitchProps {
    /**
     * If `true`, the ripples are centered.
     * They won't start at the cursor interaction position.
     * @default false
     */
    centerRipple?: boolean;

    /**
     * True if the component is checked
     */
    checked?: boolean;

    /**
     * The icon to display when the component is checked.
     */
    checkedIcon?: ReactNode;
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

    /**
     * If `true`, the touch ripple effect is disabled.
     * @default false
     */
    disableTouchRipple?: boolean;
    disableRipple?: boolean;

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
    onChange?: (value: unknown) => void;

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
    value?: boolean;
    sx?: SxProps;
    title?: string;
}

export const Switch = (props: SwitchProps) => {
    const { sx } = props;
    return <StyledSwitch sx={sx} {...props} />;
};
