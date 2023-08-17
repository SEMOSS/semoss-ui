import { Checklist, ChecklistProps } from "./Checklist";
import { Checkbox, CheckboxProps } from "../Checkbox";
import { ListItem, ListItemProps } from "../List/ListItem";
import { ListItemIcon, ListItemIconProps } from "../List/ListItemIcon";
import { ListItemText, ListItemTextProps } from "../List/ListItemText";

const CheckboxListNameSpace = Object.assign(Checklist, {
    Item: ListItem,
    Icon: ListItemIcon,
    ItemButton: Checkbox,
    ItemText: ListItemText,
});

export type {
    ChecklistProps,
    CheckboxProps,
    ListItemProps,
    ListItemIconProps,
    ListItemTextProps,
};

export { CheckboxListNameSpace as Checklist };
