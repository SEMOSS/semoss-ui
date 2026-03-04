import { Tooltip as MuiTooltip, type SxProps } from "@mui/material";
import type React from "react";

export interface TooltipProps {
	/**
	 * The element that will trigger the tooltip when hovered over or focused on.
	 */
	children?: React.ReactElement;

	/**
	 * if `true`, adds an arrow to the tooltip
	 * @default false
	 */
	arrow?: boolean;

	/**
	 * Makes a tooltip not interactive, i.e. it will close when the user hovers over the tooltip before the leaveDelay is expired.
	 * @default false
	 */
	disableInteractive?: boolean;

	/**
	 * The number of milliseconds to wait before showing the tooltip. This prop won't impact the enter touch delay
	 * @default 100
	 */
	enterDelay?: number;

	/**
	 * This prop is used to help implement the accessibility logic. If you don't provide this prop. It falls back to a randomly generated id.
	 */
	id?: string;

	/**
	 * The number of milliseconds to wait before hiding the tooltip. This prop won't impact the leave touch delay
	 * @default 0
	 */
	leaveDelay?: number;

	/**
	 * Callback fired when the component requests to be closed.
	 */
	// onClose?: (e?: React.SyntheticEvent) => void;

	/**
	 * Callback fired when the component requests to be Open.
	 */
	// onOpen?: (e?: React.SyntheticEvent) => void;

	/**
	 * if `true`, the component is shown.
	 */
	open?: boolean;

	/**
	 * tooltip placement.
	 * @default 'bottom's
	 */
	placement?:
		| "bottom-end"
		| "bottom-start"
		| "bottom"
		| "left-end"
		| "left-start"
		| "left"
		| "right-end"
		| "right-start"
		| "right"
		| "top-end"
		| "top-start"
		| "top";

	/**
	 * The system prop that allows defining system overrides as well as additional CSS styles.
	 */
	sx?: SxProps;

	/**
	 * Tooltip title. Zero-length titles string, undefined, null and false are never displayed.
	 */
	title: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
	children,
	...otherProps
}) => {
	return <MuiTooltip {...otherProps}>{children}</MuiTooltip>;
};
