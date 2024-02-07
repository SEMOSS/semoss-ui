import { RadioGroup, RadioGroupProps } from './RadioGroup';
import { Radio, RadioProps } from './Radio';

export type { RadioGroupProps, RadioProps };

const RadioGroupNameSpace = Object.assign(RadioGroup, {
    Item: Radio,
});

export { RadioGroupNameSpace as RadioGroup };

export { Radio };
