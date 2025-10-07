import { List as MuiList, type ListProps as MuiListProps } from "@mui/material";
import { type ForwardedRef, forwardRef } from "react";

export interface ListProps extends MuiListProps {
	/**
	 * The content of the component.
	 */
	children?: React.ReactNode;

	/**
	 * If `true`, compact vertical padding designed for keyboard and mouse input is used for
	 * the list and list items.
	 * The prop is available to descendant components as the `dense` context.
	 * @default false
	 */
	dense?: boolean;

	/**
	 * If `true`, vertical padding is removed from the list.
	 * @default false
	 */
	disablePadding?: boolean;

	/**
	 * The content of the subheader, normally `ListSubheader`.
	 */
	subheader?: React.ReactNode;

	/**
	 * 	String to use a HTML element for root node
	 */
	component?: React.ElementType;
}

const _List = (
	props: ListProps,
	ref: ForwardedRef<HTMLUListElement>,
): JSX.Element => {
	const { children, ...otherProps } = props;

	return (
		<MuiList ref={ref} {...otherProps}>
			{children}
		</MuiList>
	);
};

export const List = forwardRef(_List);
