import { forwardRef } from "react";
import { SxProps } from "@mui/material";
import {
    TreeItem as MuiTreeItem,
    TreeItemProps as MuiTreeItemProps,
} from "@mui/x-tree-view/";

export interface TreeItemProps extends MuiTreeItemProps {
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const TreeItem = forwardRef<HTMLLIElement, TreeItemProps>(
    (props, ref) => {
        return <MuiTreeItem {...props} ref={ref} />;
    },
);

TreeItem.displayName = "TreeItem";
