import { Card as MuiCard, type SxProps } from "@mui/material";
import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	/** children to be rendered */
	children: ReactNode;

	/** custom style object */
	sx?: SxProps;
}

export const Card = (props: CardProps) => {
	const { children, sx } = props;
	return (
		<MuiCard sx={sx} {...props}>
			{children}
		</MuiCard>
	);
};
