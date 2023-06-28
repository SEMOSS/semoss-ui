import { ReactNode } from "react";
import MuiPagination from "@mui/material/Pagination";
import { SxProps } from "@mui/system";
import { PaginationProps as MuiPaginationProps } from "@mui/material";
import { UsePaginationItem } from "@mui/material/usePagination/usePagination";

export interface PaginationRenderItemParams extends UsePaginationItem {
    color: PaginationProps["color"];
    shape: PaginationProps["shape"];
    size: PaginationProps["size"];
    variant: PaginationProps["variant"];
}

export interface PaginationProps {
    /**
     * The active color.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'standard'
     */
    color?: "primary" | "secondary" | "standard";

    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the current page.
     * This is important for screen reader users.
     *
     * For localization purposes, you can use the provided [translations](/material-ui/guides/localization/).
     * @param {string} type The link or button type to format ('page' | 'first' | 'last' | 'next' | 'previous'). Defaults to 'page'.
     * @param {number} page The page number to format.
     * @param {bool} selected If true, the current page is selected.
     * @returns {string}
     */
    getItemAriaLabel?: (
        type: "page" | "first" | "last" | "next" | "previous",
        page: number,
        selected: boolean,
    ) => string;

    /**
     * Render the item.
     * @param {PaginationRenderItemParams} params The props to spread on a PaginationItem.
     * @returns {ReactNode}
     * @default (item) => <PaginationItem {...item} />
     */
    renderItem?: (params: PaginationRenderItemParams) => React.ReactNode;

    /**
     * The shape of the pagination items.
     * @default 'circular'
     */
    shape?: "circular" | "rounded";

    /**
     * The size of the component.
     * @default 'medium'
     */
    size?: "small" | "medium" | "large";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The variant to use.
     * @default 'text'
     */
    variant?: "text" | "outlined";
}

export const Pagination = (props: PaginationProps) => {
    const { sx } = props;
    return <MuiPagination sx={sx} {...props} />;
};
