import { RadioGroup, RadioGroupProps, Radio, RadioProps } from "./RadioGroup";
import { Radio as _Radio } from "./Radio";

export type { RadioGroupProps, RadioProps };

const RadioGroupNameSpace = Object.assign(RadioGroup, {
    Item: _Radio,
});

export { RadioGroupNameSpace as RadioGroup };

export { Radio };
