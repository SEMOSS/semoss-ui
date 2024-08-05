import { AlertProps } from "../Alert";

export interface NotificationMessage {
    /**
     * Id of the message
     */
    id: string;

    /**
     * Color color of the message
     */
    color: AlertProps["color"];

    /**
     * Content of the message
     */
    message: React.ReactNode;
}
