import { StepContent as MuiStepContent, type SxProps } from "@mui/material";

export type StepContentProps = {
	/**
	 * Children
	 */
	children?: React.ReactNode;

	/** custom style object */
	sx?: SxProps;
};

export const StepContent: React.FC<StepContentProps> = ({
	children,
	...otherProps
}) => {
	return <MuiStepContent {...otherProps}>{children}</MuiStepContent>;
};
