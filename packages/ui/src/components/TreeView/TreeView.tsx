import { SxProps } from "@mui/material";
import { TreeView as MuiTreeView } from "@mui/x-tree-view/TreeView";

export interface TreeViewProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * The default icon used to collapse the node.
     */
    defaultCollapseIcon?: React.ReactNode;
    /**
     * Expanded node ids.
     * Used when the item's expansion are not controlled.
     * @default []
     */
    defaultExpanded?: string[];
    /**
     * The default icon used to expand the node.
     */
    defaultExpandIcon?: React.ReactNode;
    /**
     * If `true`, will allow focus on disabled items.
     * @default false
     */
    disabledItemsFocusable?: boolean;
    /**
     * If `true` selection is disabled.
     * @default false
     */
    disableSelection?: boolean;
    /**
     * Expanded node ids.
     * Used when the item's expansion are controlled.
     */
    expanded?: string[];
    /**
     * This prop is used to help implement the accessibility logic.
     * If you don't provide this prop. It falls back to a randomly generated id.
     */
    id?: string;
    /**
     * If true `ctrl` and `shift` will trigger multiselect.
     * @default false
     */
    multiSelect?: true;
    /**
     * Callback fired when tree items are selected/unselected.
     * @param {React.SyntheticEvent} event The event source of the callback
     * @param {string[] | string} nodeIds Ids of the selected nodes. When `multiSelect` is true
     * this is an array of strings; when false (default) a string.
     */
    onNodeSelect?: (event: React.SyntheticEvent, nodeIds: string[]) => void;
    /**
     * Callback fired when tree items are expanded/collapsed.
     * @param {React.SyntheticEvent} event The event source of the callback.
     * @param {array} nodeIds The ids of the expanded nodes.
     */
    onNodeToggle?: (event: React.SyntheticEvent, nodeIds: string[]) => void;
    /**
     * Selected node ids. (Controlled)
     * When `multiSelect` is true this takes an array of strings; when false (default) a string.
     */
    selected?: string[];
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const TreeView = (props: TreeViewProps) => {
    const { multiSelect = true } = props;
    return <MuiTreeView multiSelect={multiSelect} {...props} />;
};
