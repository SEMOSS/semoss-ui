import { TableRow as MuiTableRow, SxProps } from "@mui/material";
import { ReactNode } from "react";

export interface TableRowProps {
	/** children to be rendered */
	children?: ReactNode;

	/** custom style object */
	sx?: SxProps;

	/**
	 * Allows onClick event handling.
	 * @default void
	 */
	onClick?: (
		event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
	) => void;
}

export const TableRow = (props: TableRowProps) => {
	const { children, sx } = props;
	return (
		<MuiTableRow sx={sx} {...props}>
			{children}
		</MuiTableRow>
	);
};
