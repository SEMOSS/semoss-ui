import { CardContent as MuiCardContent, type SxProps } from "@mui/material";
import {
	type ComponentPropsWithRef,
	ForwardedRef,
	forwardRef,
	type ReactNode,
} from "react";

export interface CardContentProps extends ComponentPropsWithRef<"div"> {
	/** children to be rendered */
	children: ReactNode;

	/** custom style object */
	sx?: SxProps;

	/**
	 * Unique identifier for dom element
	 */
	id?: string;
}

export const _CardContent = (props: CardContentProps, ref) => {
	const { children, sx } = props;
	return (
		<MuiCardContent sx={sx} ref={ref} {...props}>
			{children}
		</MuiCardContent>
	);
};

export const CardContent = forwardRef(_CardContent);
