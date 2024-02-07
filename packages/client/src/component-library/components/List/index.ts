import { List, ListProps } from './List';
import { ListItem, ListItemProps } from './ListItem';
import { ListItemButton, ListItemButtonProps } from './ListItemButton';
import { ListItemIcon, ListItemIconProps } from './ListItemIcon';
import { ListItemText, ListItemTextProps } from './ListItemText';
import { ListItemAvatar, ListItemAvatarProps } from './ListItemAvatar';

const ListNameSpace = Object.assign(List, {
    Item: ListItem,
    Icon: ListItemIcon,
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
