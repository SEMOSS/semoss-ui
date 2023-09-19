import { SxProps } from "@mui/material";
import { TreeItem as MuiTreeItem } from "@mui/x-tree-view/";

export interface TreeItemProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * The icon used to collapse the node.
     */
    collapseIcon?: React.ReactNode;
    /**
     * If `true`, the node is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * The icon displayed next to an end node.
     */
    endIcon?: React.ReactNode;
    /**
     * The icon used to expand the node.
     */
    expandIcon?: React.ReactNode;
    /**
     * The icon to display next to the tree node's label.
     */
    icon?: React.ReactNode;
    /**
     * The tree node label.
     */
    label?: React.ReactNode;
    /**
     * The id of the node.
     */
    nodeId: string;
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const TreeItem = (props: TreeItemProps) => {
    return <MuiTreeItem {...props} />;
};
