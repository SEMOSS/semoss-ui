import { Switch as MuiSwitch, type SxProps, styled } from "@mui/material";
import type { ReactNode } from "react";

const StyledSwitch = styled(MuiSwitch)(({ theme, size }) => ({
	width: size === "small" ? "40px" : "52px",
	height: size === "small" ? "24px" : "32px",
	padding: 0,
	"& .MuiSwitch-switchBase": {
		padding: 0,
		margin: "4px",
		transitionDuration: "300ms",

		"&.Mui-checked": {
			transform:
				size === "small" ? "translateX(16px)" : "translateX(20px)",
			color: theme.palette.common.white,

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
		width: size === "medium" ? "24px" : "16px",
		height: size === "medium" ? "24px" : "16px",
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
	 * Props applied to the input element.
	 */
	inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
	/**
	 * The value of the component. The DOM API casts this to a string.
	 * The browser uses "on" as the default value.
	 */
	value?: boolean;
	sx?: SxProps;
	title?: string;
}

export const Switch = (props: SwitchProps) => {
	const { sx, size = "medium", inputProps } = props;
	return (
		<StyledSwitch sx={sx} size={size} inputProps={inputProps} {...props} />
	);
};
