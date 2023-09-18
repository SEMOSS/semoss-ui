import { List, ListProps } from "./List";
import { ListItem, ListItemProps } from "./ListItem";
import { ListItemButton, ListItemButtonProps } from "./ListItemButton";
import { ListItemIcon, ListItemIconProps } from "./ListItemIcon";
import { ListItemText, ListItemTextProps } from "./ListItemText";

const ListNameSpace = Object.assign(List, {
    Item: ListItem,
    Icon: ListItemIcon,
    ItemButton: ListItemButton,
    ItemText: ListItemText,
});

export type {
    ListProps,
    ListItemProps,
    ListItemButtonProps,
    ListItemIconProps,
    ListItemTextProps,
};

export { ListNameSpace as List };
