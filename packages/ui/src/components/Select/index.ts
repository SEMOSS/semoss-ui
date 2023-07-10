import { Select, SelectProps } from "./Select";
import { MenuItem } from "../../";

const SelectNameSpace = Object.assign(Select, {
    Item: MenuItem,
});

export type {SelectProps}
export { SelectNameSpace as Select };
