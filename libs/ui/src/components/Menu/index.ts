import { Menu, type MenuProps } from "./Menu";
import { MenuItem, type MenuItemProps } from "./MenuItem";

const MenuNameSpace = Object.assign(Menu, {
	Item: MenuItem,
});

export type { MenuProps, MenuItemProps };

export { MenuNameSpace as Menu };
