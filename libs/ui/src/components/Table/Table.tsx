import { Table as MuiTable, type SxProps } from "@mui/material";
import type { ReactNode } from "react";
import { forwardRef } from "react";

export interface TableProps {
	/** children to be rendered */
	children: ReactNode;

	/**
	 * Set the header sticky.
	 *
	 * ⚠️ It doesn't work with IE11.
	 * @default false
	 */
	stickyHeader?: boolean;
	/** custom style object */
	/**
	 * Allows TableCells to inherit size of the Table.
	 * @default 'medium'
	 */
	size?: "small" | "medium";
	sx?: SxProps;
}

export const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
	const { children, sx } = props;
	return (
		<MuiTable ref={ref} sx={sx} {...props}>
			{children}
		</MuiTable>
	);
});
