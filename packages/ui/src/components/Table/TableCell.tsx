import React, { ReactNode } from "react";
import MuiTableCell, {
    TableCellBaseProps as MuiTableCellProps,
} from "@mui/material/TableCell";
import { SxProps } from "@mui/system";

export interface TableCellProps {
    /** children to be rendered */
    children?: ReactNode;

    /**
     * Set the text-align on the table cell content.
     *
     * Monetary or generally number fields **should be right aligned** as that allows
     * you to add them up quickly in your head without having to worry about decimals.
     * @default 'inherit'
     */
    align?: "center" | "inherit" | "justify" | "left" | "right";

    /**
     * Sets the padding applied to the cell.
     * The prop defaults to the value (`'default'`) inherited from the parent Table component.
     */
    padding?: "checkbox" | "none" | "normal";

    /**
     * The component used for the root node.
     * Either a string to use a HTML element or a component.
     */
    component?: React.ElementType<MuiTableCellProps>;

    /**
     * Specify the size of the cell.
     * The prop defaults to the value (`'medium'`) inherited from the parent Table component.
     */
    size?: "medium" | "small";

    /**
     * Set scope attribute.
     */
    scope?: string;

    /**
     * Set aria-sort direction.
     */
    sortDirection?: "asc" | "desc" | false;

    /**
     * Specify the cell type.
     * The prop defaults to the value inherited from the parent TableHead, TableBody, or TableFooter components.
     */
    variant?: "body" | "footer" | "head";
    colSpan?: number;
    /** custom style object */
    sx?: SxProps;
}

export const TableCell = (props: TableCellProps) => {
    const { children, sx } = props;
    return (
        <MuiTableCell sx={sx} {...props}>
            {children}
        </MuiTableCell>
    );
};
