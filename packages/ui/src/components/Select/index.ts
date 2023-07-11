import { Select, SelectProps } from "./Select";
import { Item, ItemProps } from "./Item";

const SelectNameSpace = Object.assign(Select, {
    Item: Item,
});

export type { SelectProps, ItemProps };

export { SelectNameSpace as Select };
