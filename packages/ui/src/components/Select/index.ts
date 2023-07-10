import { Select, SelectProps } from "./Select";
import { Option, OptionProps } from "./Option";

const SelectNameSpace = Object.assign(Select, {
    Option: Option,
});

export type { SelectProps, OptionProps };

export { SelectNameSpace as Select };
