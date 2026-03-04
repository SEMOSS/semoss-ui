import { Box as MuiBox, type SxProps } from "@mui/material";
import type { ReactNode } from "react";
import { forwardRef } from "react";

export interface BoxProps {
	/** children to be rendered */
	children?: ReactNode;

	//** onClick function */
	onClick?: () => void;

	flex?: number;

	/** custom style object */
	sx?: SxProps;
	title?: string;
}
export const Box = forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
	const { children, sx } = props;
	return (
		<MuiBox ref={ref} sx={sx} {...props}>
			{children}
		</MuiBox>
	);
});
