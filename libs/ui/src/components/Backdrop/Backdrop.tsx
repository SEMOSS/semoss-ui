import { Backdrop as MuiBackdrop, type SxProps } from "@mui/material";
import type { ReactNode } from "react";

export interface BackdropProps {
	/** children to be rendered */
	children?: ReactNode;

	/** custom style object */
	sx?: SxProps;

	/**
	 * If `true`, the component is shown.
	 */
	open: boolean;
}

export const Backdrop = (props: BackdropProps) => {
	const { children, sx } = props;
	return (
		<MuiBackdrop sx={sx} {...props}>
			{children}
		</MuiBackdrop>
	);
};
