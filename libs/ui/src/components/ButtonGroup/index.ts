import { Button, type ButtonProps } from "../Button";
import { ButtonGroup, type ButtonGroupProps } from "./ButtonGroup";

const ButtonGroupNameSpace = Object.assign(ButtonGroup, {
	Item: Button,
});

export type { ButtonGroupProps, ButtonProps };
export { ButtonGroupNameSpace as ButtonGroup };
