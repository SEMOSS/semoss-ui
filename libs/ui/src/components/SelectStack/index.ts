import { MenuItem } from "../Menu";
import { SelectStack, type SelectStackProps } from "./SelectStack";

const SelectStackNameSpace = Object.assign(SelectStack, {
	Item: MenuItem,
});

export type { SelectStackProps };

export { SelectStackNameSpace as SelectStack };
