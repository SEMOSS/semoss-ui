import React, { useState, useEffect } from "react";
import { Snackbar, SxProps } from "@mui/material";

import { NotificationMessage } from "./notification.types";

// generate a uuid
let counter = 1;
const getUuid = () => {
    return `notification--${++counter}`;
};

import { Alert } from "../Alert";
import { NotificationContext } from "./NotificationContext";

interface anchorOriginProps {
    horizontal: "center" | "left" | "right";
    vertical: "bottom" | "top";
}
export interface NotificationProps {
    /**
     * Content to show in the notification
     */
    children: React.ReactElement;

    /**
     * The anchor of the `Notification`.
     * On smaller screens, the component grows to occupy all the available width,
     * the horizontal alignment is ignored.
     * @default { vertical: 'top', horizontal: 'right' }
     */
    anchorOrigin?: anchorOriginProps;

    /**
     * The number of milliseconds to wait before automatically calling the
     * `onClose` function. `onClose` should then set the state of the `open`
     * prop to hide the Snackbar. This behavior is disabled by default with
     * the `null` value.
     * @default 300
     */
    autoHideDuration?: number | null;

    /**
     * Properties to pass to the notification
     */
    sx?: SxProps;
}

/**
 * Notification component
 */
export const Notification = (props: NotificationProps): JSX.Element => {
    const {
        children,
        anchorOrigin = { vertical: "top", horizontal: "right" },
        autoHideDuration = 3000,
        sx,
    } = props;

    const [notifications, setNotifications] = useState<NotificationMessage[]>(
        [],
    );
    const [active, setActive] = useState<NotificationMessage | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // listen to changes in the notifications and react
    useEffect(() => {
        if (notifications.length) {
            if (!active) {
                // set the active one
                setActive(notifications[0]);

                // remove from the notitications
                setNotifications((notifications) => notifications.slice(1));

                // open it
                setIsOpen(true);
            } else if (active && isOpen) {
                // nullify it
                setActive(null);

                // close it
                setIsOpen(false);
            }
        } else {
            //noop
        }
    }, [notifications, active, isOpen]);

    /**
     * Add a new notification
     * @param state - state of the Notification Item
     */
    const addNotification = (message: NotificationMessage) => {
        // generate an id if there isn't one
        if (!message.id) {
            message.id = getUuid();
        }

        setNotifications((notifications) => {
            return [
                ...notifications,
                {
                    id: "",
                    color: "info",
                    message: "",
                    ...message,
                },
            ];
        });
    };

    /**
     * Remove a notification
     * @param id - id of the notification to remove
     */
    const removeNotification = (id: string) => {
        setNotifications((notifications) => {
            return notifications.filter((n) => n.id !== id);
        });
    };

    /**
     * Close the notifications
     */
    const closeNotification = () => {
        // nullify it
        setActive(null);

        // close it
        setIsOpen(false);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications: notifications,
                add: addNotification,
                remove: removeNotification,
                close: closeNotification,
            }}
        >
            {children}
            <Snackbar
                key={active ? active.id : undefined}
                open={isOpen}
                anchorOrigin={anchorOrigin}
                autoHideDuration={autoHideDuration}
                onClose={(event, reason) => {
                    if (reason === "clickaway") {
                        return;
                    }

                    // close it
                    setIsOpen(false);
                }}
                TransitionProps={{
                    onExited: () => {
                        setActive(null);
                    },
                }}
                sx={{ maxWidth: "500px", ...sx }}
            >
                <div>
                    {active ? (
                        <>
                            <Alert
                                onClose={() => setIsOpen(false)}
                                severity={active.color}
                                sx={{ width: "100%" }}
                            >
                                {active.message}
                            </Alert>
                        </>
                    ) : (
                        <></>
                    )}
                </div>
            </Snackbar>
        </NotificationContext.Provider>
    );
};
