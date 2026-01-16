import {
	StepLabel as MuiStepLabel,
	type StepIconProps,
	type SxProps,
} from "@mui/material";

export type StepLabelProps = {
	/**
	 *  Is it in the error state?
	 */
	error?: boolean;

	/**
	 *
	 */
	StepIconComponent?: React.ElementType<StepIconProps>;

	/**
	 *
	 */
	StepIconProps?: Partial<StepIconProps>;

	/**
	 * Children
	 */
	children?: React.ReactNode;

	/** custom style object */
	sx?: SxProps;
};

export const StepLabel: React.FC<StepLabelProps> = ({
	children,
	...otherProps
}) => {
	return <MuiStepLabel {...otherProps}>{children}</MuiStepLabel>;
};
