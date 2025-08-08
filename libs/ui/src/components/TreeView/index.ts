import { TreeItem, type TreeItemProps } from "./TreeItem";
import { TreeView, type TreeViewProps } from "./TreeView";

const TreeViewNameSpace = Object.assign(TreeView, {
	Item: TreeItem,
});

export type { TreeViewProps, TreeItemProps };

export { TreeViewNameSpace as TreeView };
