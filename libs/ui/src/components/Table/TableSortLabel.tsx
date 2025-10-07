import {
	TableSortLabel as MuiTableSort,
	type SxProps,
	type TableSortLabelProps,
} from "@mui/material";
import type { ReactNode } from "react";

export type TableSortProps = TableSortLabelProps & {
	/** children to be rendered */
	children?: ReactNode;
	/** custom style object */
	sx?: SxProps;
};

export const TableSortLabel = (props: TableSortProps) => {
	const { children, sx } = props;
	return (
		<MuiTableSort sx={sx} {...props}>
			{children}
		</MuiTableSort>
	);
};
