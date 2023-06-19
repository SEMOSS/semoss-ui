import { Input, InputProps } from "./Input";
import { InputLabel } from "./InputLabel";

const InputNameSpace = Object.assign(Input, {
    Label: InputLabel,
});

export type { InputProps };

export { Input };

export { InputLabel };
