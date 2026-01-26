import { Menu } from "../Menu";
import { Select, type SelectProps } from "./Select";

const SelectNameSpace = Object.assign(Select, {
	Item: Menu.Item,
});

export type { SelectProps };

export { SelectNameSpace as Select };
