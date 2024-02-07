import { TreeView, TreeViewProps } from './TreeView';
import { TreeItem, TreeItemProps } from './TreeItem';

const TreeViewNameSpace = Object.assign(TreeView, {
    Item: TreeItem,
});

export type { TreeViewProps, TreeItemProps };

export { TreeViewNameSpace as TreeView };
