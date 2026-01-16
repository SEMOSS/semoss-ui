import { TableCell as MuiTableCell, type SxProps } from "@mui/material";
import type React from "react";
import type { ReactNode } from "react";

export interface TableCellProps {
	/**
	 * Set the text-align on the table cell content.
	 *
	 * Monetary or generally number fields **should be right aligned** as that allows
	 * you to add them up quickly in your head without having to worry about decimals.
	 * @default 'inherit'
	 */
	align?: "inherit" | "left" | "center" | "right" | "justify";

	/**
	 * children to be rendered
	 */
	children?: ReactNode;

	/**
	 * Sets or retrieves the number columns in the table that the object should span.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLTableCellElement/colSpan)
	 */
	colSpan?: number;

	/**
	 * The component used for the root node.
	 * Either a string to use a HTML element or a component.
	 */
	component?: React.ElementType<
		React.ThHTMLAttributes<HTMLTableCellElement> &
			React.TdHTMLAttributes<HTMLTableCellElement>
	>;

	/**
	 * Sets the padding applied to the cell.
	 * The prop defaults to the value (`'default'`) inherited from the parent Table component.
	 */
	padding?: "normal" | "checkbox" | "none";

	/**
	 * Set scope attribute.
	 */
	scope?: string;

	/**
	 * Specify the size of the cell.
	 * The prop defaults to the value (`'medium'`) inherited from the parent Table component.
	 */
	size?: "small" | "medium";

	/**
	 * Specify the cell type.
	 * The prop defaults to the value inherited from the parent TableHead, TableBody, or TableFooter components.
	 */
	variant?: "head" | "body" | "footer";

	/**
	 * Custom style object
	 */
	sx?: SxProps;
}

export const TableCell: React.FC<TableCellProps> = ({
	children,
	...otherProps
}) => {
	return <MuiTableCell {...otherProps}>{children}</MuiTableCell>;
};
