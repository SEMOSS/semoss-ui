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

export const TreeItem = (props: TreeItemProps) => {
    return <MuiTreeItem {...props} />;
};
