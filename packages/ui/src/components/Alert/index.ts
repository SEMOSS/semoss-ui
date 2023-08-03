import { Alert as _Alert, AlertProps } from "./Alert";
import { AlertTitle, AlertTitleProps } from "./AlertTitle";

const AlertNameSpace = Object.assign(_Alert, {
    Title: AlertTitle,
});

export type { AlertProps, AlertTitleProps };

export { AlertNameSpace as Alert, AlertTitle };
