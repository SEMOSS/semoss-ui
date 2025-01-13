import { createContext } from "react";

import { NotificationMessage } from "./notification.types";

export type NotificationValue = {
    /**
     * List of notifications
     */
    notifications: NotificationMessage[];

    /**
     *  Add a new item to the notifications
     */
    add: (message: Partial<NotificationMessage>) => void;

    /**
     * Remove a notification from the list
     */
    remove: (id: string) => void;

    /**
     * Close the notifications
     */
    close: () => void;
};

/**
 * NotificationContext
 */
export const NotificationContext = createContext<NotificationValue | undefined>(
    undefined,
);
