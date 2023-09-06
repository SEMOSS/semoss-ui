import { Drawer, DrawerProps } from "./Drawer";
import { DrawerItem, DrawerItemProps } from "./DrawerItem";
import { DrawerHeader, DrawerHeaderProps } from "./DrawerHeader";
import { DrawerFooter, DrawerFooterProps } from "./DrawerFooter";
import { Divider } from "../Divider";

const DrawerNameSpace = Object.assign(Drawer, {
    Item: DrawerItem,
    Header: DrawerHeader,
    Divider: Divider,
    Footer: DrawerFooter,
});

export type {
    DrawerProps,
    DrawerItemProps,
    DrawerHeaderProps,
    DrawerFooterProps,
};
export { DrawerNameSpace as Drawer };
