import { RadioGroup, RadioGroupProps } from "./RadioGroup";
import { RadioField, Radio, RadioProps } from "./Radio";

export type { RadioGroupProps, RadioProps };

const RadioGroupNameSpace = Object.assign(RadioGroup, {
    Item: RadioField,
});

export { RadioGroupNameSpace as RadioGroup };

export { Radio };
