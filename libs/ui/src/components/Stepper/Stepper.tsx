import { Stepper as MuiStepper, type SxProps } from "@mui/material";

export type StepperProps = {
	/**
	 * Children
	 */
	children?: React.ReactNode;

	/**
	 * Set the active step (zero based index).
	 * Set to -1 to disable all the steps.
	 * @default 0
	 */
	activeStep?: number;

	/**
	 * The component orientation (layout flow direction).
	 * @default 'horizontal'
	 */
	orientation?: "horizontal" | "vertical";

	/** custom style object */
	sx?: SxProps;
};

export const Stepper: React.FC<StepperProps> = ({
	children,
	...otherProps
}) => {
	return <MuiStepper {...otherProps}>{children}</MuiStepper>;
};
