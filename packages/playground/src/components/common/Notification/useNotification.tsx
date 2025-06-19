import { useContext } from 'react';

import { NotificationContext } from './NotificationContext';

/**
 * Create a hook to access the current Notification's context
 * @returns a hook that accesses the container
 */
export function useNotification() {
    const c = useContext(NotificationContext);
    if (c === undefined) {
        throw new Error('useNotification must be used within a Notification');
    }

    return c;
}
