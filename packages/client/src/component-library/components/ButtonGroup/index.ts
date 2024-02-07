import { ButtonGroup, ButtonGroupProps } from './ButtonGroup';
import { Button, ButtonProps } from '../Button';

const ButtonGroupNameSpace = Object.assign(ButtonGroup, {
    Item: Button,
});

export type { ButtonGroupProps, ButtonProps };
export { ButtonGroupNameSpace as ButtonGroup };
