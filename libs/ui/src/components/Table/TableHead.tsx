import { TableHead as MuiTableHead, type SxProps } from "@mui/material";
import type { ReactNode } from "react";

export interface TableHeadProps {
	/** children to be rendered */
	children?: ReactNode;

	/** custom style object */
	sx?: SxProps;
}

export const TableHead = (props: TableHeadProps) => {
	const { children, sx } = props;
	return (
		<MuiTableHead sx={sx} {...props}>
			{children}
		</MuiTableHead>
	);
};
