import { SelectStack, SelectStackProps } from "./SelectStack";
import { MenuItem } from "../Menu";

const SelectStackNameSpace = Object.assign(SelectStack, {
    Item: MenuItem,
});

export type { SelectStackProps };

export { SelectStackNameSpace as SelectStack };
