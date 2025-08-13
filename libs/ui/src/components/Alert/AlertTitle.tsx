import { AlertTitle as MuiAlertTitle, type SxProps } from "@mui/material";
import type { ReactNode } from "react";

export interface AlertTitleProps {
	/** children to be rendered */
	children?: ReactNode;

	/** custom style object */
	sx?: SxProps;
}

export const AlertTitle: React.FC<AlertTitleProps> = ({
	children,
	sx,
	...otherProps
}) => {
	return (
		<MuiAlertTitle sx={sx} {...otherProps}>
			{children}
		</MuiAlertTitle>
	);
};
