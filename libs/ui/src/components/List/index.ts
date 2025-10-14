import { List, type ListProps } from "./List";
import { ListItem, type ListItemProps } from "./ListItem";
import { ListItemAvatar, type ListItemAvatarProps } from "./ListItemAvatar";
import { ListItemButton, type ListItemButtonProps } from "./ListItemButton";
import { ListItemIcon, type ListItemIconProps } from "./ListItemIcon";
import { ListItemText, type ListItemTextProps } from "./ListItemText";

const ListNameSpace = Object.assign(List, {
	Item: ListItem,
	ItemIcon: ListItemIcon,
	ItemButton: ListItemButton,
	ItemText: ListItemText,
	ItemAvatar: ListItemAvatar,
});

export type {
	ListProps,
	ListItemProps,
	ListItemButtonProps,
	ListItemIconProps,
	ListItemTextProps,
	ListItemAvatarProps,
};

export { ListNameSpace as List };
