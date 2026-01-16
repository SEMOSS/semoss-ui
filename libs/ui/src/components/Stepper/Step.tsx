import { Step as MuiStep, type SxProps } from "@mui/material";

export type StepProps = {
	/**
	 * Children
	 */
	children?: React.ReactNode;

	/**
	 *  Is it in the active state?
	 */
	active?: boolean;

	/**
	 *  Is it in the completed state?
	 */
	completed?: boolean;

	/** custom style object */
	sx?: SxProps;
};

export const Step: React.FC<StepProps> = ({ children, ...otherProps }) => {
	return <MuiStep {...otherProps}>{children}</MuiStep>;
};
