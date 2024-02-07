import { Menu, MenuProps } from './Menu';
import { MenuItem, MenuItemProps } from './MenuItem';

const MenuNameSpace = Object.assign(Menu, {
    Item: MenuItem,
});

export type { MenuProps, MenuItemProps };

export { MenuNameSpace as Menu, MenuItem };
