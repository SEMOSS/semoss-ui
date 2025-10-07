import {
	TableContainer as MuiTableContainer,
	type SxProps,
} from "@mui/material";
import type { ReactNode } from "react";

export interface TableContainerProps {
	/** children to be rendered */
	children?: ReactNode;

	/** custom style object */
	sx?: SxProps;
}

export const TableContainer = (props: TableContainerProps) => {
	const { children, sx } = props;
	return (
		<MuiTableContainer sx={sx} {...props}>
			{children}
		</MuiTableContainer>
	);
};
