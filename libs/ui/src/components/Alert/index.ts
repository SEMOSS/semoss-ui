import { Alert, AlertProps } from "./Alert";
import { AlertTitle, AlertTitleProps } from "./AlertTitle";

const AlertNameSpace = Object.assign(Alert, {
    Title: AlertTitle,
});

export type { AlertProps, AlertTitleProps };

export { AlertNameSpace as Alert, AlertTitle };
