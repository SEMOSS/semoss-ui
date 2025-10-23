import { Radio, type RadioProps } from "./Radio";
import { RadioGroup, type RadioGroupProps } from "./RadioGroup";

export type { RadioGroupProps, RadioProps };

const RadioGroupNameSpace = Object.assign(RadioGroup, {
	Item: Radio,
});

export { RadioGroupNameSpace as RadioGroup };
