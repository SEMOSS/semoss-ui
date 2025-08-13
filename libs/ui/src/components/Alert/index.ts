import { Alert, type AlertProps } from "./Alert";
import { AlertTitle, type AlertTitleProps } from "./AlertTitle";

const AlertNameSpace = Object.assign(Alert, {
	Title: AlertTitle,
});

export type { AlertProps, AlertTitleProps };

export { AlertNameSpace as Alert };
