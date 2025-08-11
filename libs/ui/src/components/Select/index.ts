import { MenuItem } from "../Menu";
import { Select, type SelectProps } from "./Select";

const SelectNameSpace = Object.assign(Select, {
	Item: MenuItem,
});

export type { SelectProps };

export { SelectNameSpace as Select };
