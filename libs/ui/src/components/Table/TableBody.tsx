import { TableBody as MuiTableBody, type SxProps } from "@mui/material";
import type { ReactNode } from "react";

export interface TableBodyProps {
	/** children to be rendered */
	/**
	 * The content of the component, normally `TableRow`.
	 */
	children?: ReactNode;

	/** custom style object */
	sx?: SxProps;
}

export const TableBody = (props: TableBodyProps) => {
	const { children, sx } = props;
	return (
		<MuiTableBody sx={sx} {...props}>
			{children}
		</MuiTableBody>
	);
};
