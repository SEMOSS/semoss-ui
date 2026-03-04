import { CardActions as MuiCardActions, type SxProps } from "@mui/material";
import {
	type ComponentPropsWithRef,
	ForwardedRef,
	forwardRef,
	type ReactNode,
} from "react";

export interface CardActionsProps extends ComponentPropsWithRef<"div"> {
	/** custom style object */
	sx?: SxProps;

	/** children to be rendered */
	children: ReactNode;

	/**
	 * If `true`, the actions do not have additional margin.
	 * @default false
	 */
	disableSpacing?: boolean;

	/**
	 * Unique identifier for dom element
	 */
	id?: string;
}

export const _CardActions = (props: CardActionsProps, ref) => {
	const { sx, children } = props;
	return (
		<MuiCardActions sx={sx} ref={ref} {...props}>
			{children}
		</MuiCardActions>
	);
};

export const CardActions = forwardRef(_CardActions);
